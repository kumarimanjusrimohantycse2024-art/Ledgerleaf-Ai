"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Users, Mail, Phone, Building2, X } from "lucide-react";
import { authApi } from "@/lib/api";

export default function ClientsPage() {
  const [clients, setClients] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = (q = "") => {
    setLoading(true);
    authApi(`/api/v1/clients?page_size=50${q ? `&search=${encodeURIComponent(q)}` : ""}`)
      .then(setClients).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Client name is required"); return; }
    setSaving(true); setError("");
    try {
      await authApi("/api/v1/clients", { method: "POST", body: JSON.stringify(form) });
      setShowCreate(false);
      setForm({ name: "", email: "", phone: "", company: "", address: "", notes: "" });
      load();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Clients</h1>
          <p className="text-sm text-charcoal-400 mt-1">{clients.total} client{clients.total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-sage-300 bg-white text-sm text-charcoal-800 placeholder:text-charcoal-300 focus:border-forest-500 focus:ring-1 focus:ring-forest-500" />
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-sage-100 rounded-xl animate-pulse" />)}</div>
      ) : clients.items.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-charcoal-200 mx-auto mb-4" />
          <p className="text-sm font-medium text-charcoal-600">No clients yet</p>
          <p className="text-xs text-charcoal-400 mt-1">Add your first client to start creating invoices.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-sage-200 divide-y divide-sage-100">
          {clients.items.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-sage-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center text-sm font-bold text-forest-700">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal-800">{c.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.email && <span className="text-xs text-charcoal-400 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    {c.company && <span className="text-xs text-charcoal-400 flex items-center gap-1"><Building2 className="w-3 h-3" />{c.company}</span>}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.is_active ? "bg-forest-100 text-forest-700" : "bg-charcoal-100 text-charcoal-500"}`}>
                {c.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-charcoal-900">Add Client</h2>
              <button onClick={() => setShowCreate(false)} className="text-charcoal-400 hover:text-charcoal-600"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="bg-error/10 text-error text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required
                  className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" placeholder="Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">Email</label>
                  <input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} type="email"
                    className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" placeholder="billing@acme.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" placeholder="+91..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">Company</label>
                <input value={form.company} onChange={(e) => setForm({...form, company: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" placeholder="Company name" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-sage-300 text-sm font-medium text-charcoal-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold">{saving ? "Saving…" : "Add Client"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
