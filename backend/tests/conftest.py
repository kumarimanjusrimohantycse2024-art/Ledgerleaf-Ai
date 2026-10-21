"""LedgerLeaf AI — Test configuration and fixtures."""
from __future__ import annotations

import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_internal_token, generate_uuid
from app.main import app
from app.models.models import OrgMembership, OrgRole, Organization, User


# Use in-memory SQLite for tests
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create all tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    import bcrypt
    user = User(
        id=generate_uuid(),
        email="test@example.com",
        full_name="Test User",
        password_hash=bcrypt.hashpw(b"Test1234!", bcrypt.gensalt()).decode(),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_org(db_session: AsyncSession, test_user: User) -> Organization:
    """Create a test organization with user as owner."""
    org = Organization(
        id=generate_uuid(),
        name="Test Agency",
        slug="test-agency",
        country="IN",
        currency="INR",
        timezone="Asia/Kolkata",
    )
    db_session.add(org)
    await db_session.flush()

    membership = OrgMembership(
        id=generate_uuid(),
        user_id=test_user.id,
        org_id=org.id,
        role=OrgRole.OWNER,
    )
    db_session.add(membership)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture
async def second_user(db_session: AsyncSession) -> User:
    """Create a second user for cross-tenant tests."""
    import bcrypt
    user = User(
        id=generate_uuid(),
        email="other@example.com",
        full_name="Other User",
        password_hash=bcrypt.hashpw(b"Test1234!", bcrypt.gensalt()).decode(),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def second_org(db_session: AsyncSession, second_user: User) -> Organization:
    """Create a second org for isolation tests."""
    org = Organization(
        id=generate_uuid(),
        name="Other Agency",
        slug="other-agency",
        country="US",
        currency="USD",
        timezone="America/New_York",
    )
    db_session.add(org)
    await db_session.flush()
    membership = OrgMembership(
        id=generate_uuid(),
        user_id=second_user.id,
        org_id=org.id,
        role=OrgRole.OWNER,
    )
    db_session.add(membership)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture
async def client(test_user: User) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated HTTP client."""
    token = create_internal_token(test_user.id)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", headers={"Authorization": f"Bearer {token}"}) as c:
        yield c


@pytest_asyncio.fixture
async def client_with_org(test_user: User, test_org: Organization) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated HTTP client with org header."""
    token = create_internal_token(test_user.id)
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://test",
        headers={"Authorization": f"Bearer {token}", "X-Org-Id": test_org.id}
    ) as c:
        yield c


@pytest_asyncio.fixture
async def second_client(second_user: User, second_org: Organization) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client for second org — for cross-tenant tests."""
    token = create_internal_token(second_user.id)
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://test",
        headers={"Authorization": f"Bearer {token}", "X-Org-Id": second_org.id}
    ) as c:
        yield c
