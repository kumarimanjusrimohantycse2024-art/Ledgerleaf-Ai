"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Check, X as XIcon, Clock, Shield } from "lucide-react";
import { authApi, formatDate, getStatusColor } from "@/lib/api";

export default function ApprovalsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); authApi("/api/v1/approvals").then(setData).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const decide = async (id: string, approved: boolean, reason?: string) => {
    try {
      await authApi(`/api/v1/approvals/${id}/decide`, { method: "POST", body: JSON.stringify({ approved, reason }) });
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-charcoal-900">Approvals</h1><p className="text-sm text-charcoal-400 mt-1">Review proposed actions before execution</p></div>

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-sage-100 rounded-xl animate-pulse" />)}</div>
      : data.items.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck className="w-12 h-12 text-charcoal-200 mx-auto mb-4" />
          <p className="text-sm font-medium text-charcoal-600">No pending approvals</p>
          <p className="text-xs text-charcoal-400 mt-1">AI-proposed actions will appear here for your review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border border-sage-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.risk_level === "high" ? "bg-error/10" : p.risk_level === "medium" ? "bg-warning/10" : "bg-forest-100"}`}>
                    <Shield className={`w-5 h-5 ${p.risk_level === "high" ? "text-error" : p.risk_level === "medium" ? "text-warning" : "text-forest-600"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal-800">{p.action_type.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                    {p.recipient && <p className="text-xs text-charcoal-400 mt-0.5">To: {p.recipient}</p>}
                    <div className="mt-2 bg-sage-50 rounded-lg p-3 text-xs text-charcoal-600 font-mono max-w-md overflow-auto">{JSON.stringify(p.payload, null, 2)}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(p.status)}`}>{p.status.replace("_", " ")}</span>
                      <span className="text-xs text-charcoal-400">Expires: {formatDate(p.expires_at)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${p.risk_level === "high" ? "bg-error/10 text-error" : p.risk_level === "medium" ? "bg-warning/10 text-warning" : "bg-sage-100 text-charcoal-500"}`}>{p.risk_level} risk</span>
                    </div>
                  </div>
                </div>
                {p.status === "pending_approval" && (
                  <div className="flex gap-2">
                    <button onClick={() => decide(p.id, false, "Rejected by user")} className="flex items-center gap-1 text-xs font-medium text-error bg-error/10 hover:bg-error/20 px-3 py-1.5 rounded-lg"><XIcon className="w-3 h-3" /> Reject</button>
                    <button onClick={() => decide(p.id, true)} className="flex items-center gap-1 text-xs font-medium text-white bg-forest-600 hover:bg-forest-700 px-3 py-1.5 rounded-lg"><Check className="w-3 h-3" /> Approve</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
