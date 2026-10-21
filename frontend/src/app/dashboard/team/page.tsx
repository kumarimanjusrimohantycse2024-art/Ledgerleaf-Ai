"use client";
import { Shield, Users, Mail, Crown, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { authApi<any[]>("/api/v1/auth/members").then(setMembers).catch(() => {}).finally(() => setLoading(false)); }, []);

  const roleIcon = (role: string) => role === "owner" ? <Crown className="w-3.5 h-3.5 text-warning" /> : <UserCheck className="w-3.5 h-3.5 text-forest-600" />;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-charcoal-900">Team</h1><p className="text-sm text-charcoal-400 mt-1">Manage workspace members and roles</p></div>
      {loading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-sage-100 rounded-xl animate-pulse" />)}</div>
      : members.length === 0 ? <div className="text-center py-16"><Users className="w-12 h-12 text-charcoal-200 mx-auto mb-4" /><p className="text-sm text-charcoal-600">No team members</p></div>
      : (
        <div className="bg-white rounded-xl border border-sage-200 divide-y divide-sage-100">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-forest-100 rounded-full flex items-center justify-center text-sm font-bold text-forest-700">{m.full_name?.charAt(0) || "U"}</div>
                <div><p className="text-sm font-semibold text-charcoal-800">{m.full_name}</p><p className="text-xs text-charcoal-400 flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</p></div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-sage-100 text-charcoal-600">{roleIcon(m.role)} {m.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
