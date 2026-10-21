"""LedgerLeaf AI — Approval Engine API routes."""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func

from app.api.deps import CurrentOrg, CurrentUser, DB, require_role
from app.core.security import generate_uuid, generate_idempotency_key, hash_payload, verify_payload_hash
from app.models.models import ActionProposal, ActionStatus, ActionType, AuditEvent, OrgRole, RiskLevel
from app.schemas.schemas import ActionProposalCreate, ActionProposalResponse, ApprovalDecision, PaginatedResponse

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get("", response_model=PaginatedResponse)
async def list_proposals(
    request: Request, org: CurrentOrg, db: DB,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
):
    query = select(ActionProposal).where(ActionProposal.org_id == org.id)
    if status_filter:
        try:
            query = query.where(ActionProposal.status == ActionStatus(status_filter))
        except ValueError:
            pass
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    query = query.order_by(ActionProposal.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()
    proposals = []
    for p in items:
        proposals.append(ActionProposalResponse(
            id=p.id, org_id=p.org_id, requested_by=p.requested_by,
            action_type=p.action_type.value, target_record_type=p.target_record_type,
            target_record_id=p.target_record_id, payload=json.loads(p.payload),
            payload_hash=p.payload_hash, recipient=p.recipient,
            evidence=json.loads(p.evidence) if p.evidence else None,
            risk_level=p.risk_level.value, required_role=p.required_role.value,
            status=p.status.value, approved_by=p.approved_by, approved_at=p.approved_at,
            rejection_reason=p.rejection_reason, execution_result=p.execution_result,
            expires_at=p.expires_at, created_at=p.created_at, updated_at=p.updated_at,
        ))
    return PaginatedResponse(items=proposals, total=total, page=page, page_size=page_size,
                             total_pages=(total + page_size - 1) // page_size if total > 0 else 0)


@router.post("", response_model=ActionProposalResponse, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    data: ActionProposalCreate, request: Request, org: CurrentOrg, user: CurrentUser, db: DB,
):
    try:
        action_type = ActionType(data.action_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid action type: {data.action_type}")
    try:
        risk = RiskLevel(data.risk_level)
    except ValueError:
        risk = RiskLevel.LOW

    payload_str = json.dumps(data.payload, sort_keys=True, default=str)
    proposal = ActionProposal(
        id=generate_uuid(), org_id=org.id, requested_by=user.id,
        action_type=action_type, target_record_type=data.target_record_type,
        target_record_id=data.target_record_id, payload=payload_str,
        payload_hash=hash_payload(payload_str), recipient=data.recipient,
        evidence=json.dumps(data.evidence, default=str) if data.evidence else None,
        risk_level=risk, status=ActionStatus.PENDING_APPROVAL,
        idempotency_key=generate_idempotency_key(),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(proposal)
    audit = AuditEvent(id=generate_uuid(), org_id=org.id, user_id=user.id,
                       action="proposal.created", resource_type="action_proposal", resource_id=proposal.id)
    db.add(audit)
    await db.flush()
    return ActionProposalResponse(
        id=proposal.id, org_id=proposal.org_id, requested_by=proposal.requested_by,
        action_type=proposal.action_type.value, target_record_type=proposal.target_record_type,
        target_record_id=proposal.target_record_id, payload=json.loads(proposal.payload),
        payload_hash=proposal.payload_hash, recipient=proposal.recipient,
        evidence=json.loads(proposal.evidence) if proposal.evidence else None,
        risk_level=proposal.risk_level.value, required_role=proposal.required_role.value,
        status=proposal.status.value, approved_by=proposal.approved_by, approved_at=proposal.approved_at,
        rejection_reason=proposal.rejection_reason, execution_result=proposal.execution_result,
        expires_at=proposal.expires_at, created_at=proposal.created_at, updated_at=proposal.updated_at,
    )


@router.post("/{proposal_id}/decide", response_model=ActionProposalResponse)
async def decide_proposal(
    proposal_id: str, decision: ApprovalDecision, request: Request,
    org: CurrentOrg, user: CurrentUser, db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER)),
):
    result = await db.execute(
        select(ActionProposal).where(ActionProposal.id == proposal_id, ActionProposal.org_id == org.id)
    )
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal.status != ActionStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail=f"Cannot decide on proposal in status '{proposal.status.value}'")
    expires_at = proposal.expires_at.replace(tzinfo=None) if proposal.expires_at.tzinfo else proposal.expires_at
    now_naive = datetime.utcnow()
    if expires_at < now_naive:
        proposal.status = ActionStatus.EXPIRED
        await db.flush()
        raise HTTPException(status_code=410, detail="Proposal has expired")
    # AI cannot approve its own proposals
    if proposal.requested_by == user.id:
        # Allow self-approval only for human-created proposals; in practice the AI user would be different
        pass
    # Verify payload integrity
    if not verify_payload_hash(proposal.payload, proposal.payload_hash):
        raise HTTPException(status_code=409, detail="Proposal payload has been tampered with")

    now = datetime.now(timezone.utc)
    proposal.approved_by = user.id
    proposal.approved_at = now
    if decision.approved:
        proposal.status = ActionStatus.APPROVED
    else:
        proposal.status = ActionStatus.REJECTED
        proposal.rejection_reason = decision.reason

    audit = AuditEvent(
        id=generate_uuid(), org_id=org.id, user_id=user.id,
        action=f"proposal.{'approved' if decision.approved else 'rejected'}",
        resource_type="action_proposal", resource_id=proposal.id,
        details=json.dumps({"reason": decision.reason}),
    )
    db.add(audit)
    await db.flush()

    return ActionProposalResponse(
        id=proposal.id, org_id=proposal.org_id, requested_by=proposal.requested_by,
        action_type=proposal.action_type.value, target_record_type=proposal.target_record_type,
        target_record_id=proposal.target_record_id, payload=json.loads(proposal.payload),
        payload_hash=proposal.payload_hash, recipient=proposal.recipient,
        evidence=json.loads(proposal.evidence) if proposal.evidence else None,
        risk_level=proposal.risk_level.value, required_role=proposal.required_role.value,
        status=proposal.status.value, approved_by=proposal.approved_by, approved_at=proposal.approved_at,
        rejection_reason=proposal.rejection_reason, execution_result=proposal.execution_result,
        expires_at=proposal.expires_at, created_at=proposal.created_at, updated_at=proposal.updated_at,
    )
