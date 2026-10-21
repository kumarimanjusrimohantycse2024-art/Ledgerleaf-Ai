"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FileText, X, Trash2 } from "lucide-react";
import { authApi, formatCurrency, formatDate, getStatusColor } from "@/lib/api";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any>({ items: [], total: 0 });
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState({
    client_id: "", issue_date: "",
    due_date: "", notes: "", payment_terms: "",
    line_items: [{ description: "", quantity: "1", unit_price: "", tax_percent: "18", discount_percent: "0" }],
  });

  const load = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    authApi(`/api/v1/invoices${params}`).then(setInvoices).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); authApi("/api/v1/clients?page_size=100").then((r: any) => setClients(r.items || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [statusFilter]);

  const addLine = () => setForm({ ...form, line_items: [...form.line_items, { description: "", quantity: "1", unit_price: "", tax_percent: "18", discount_percent: "0" }] });
  const removeLine = (i: number) => setForm({ ...form, line_items: form.line_items.filter((_, idx) => idx !== i) });
  const updateLine = (i: number, field: string, value: string) => {
    const items = [...form.line_items];
    (items[i] as any)[field] = value;
    setForm({ ...form, line_items: items });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      if (!form.client_id) throw new Error("Select a client");
      if (!form.due_date) throw new Error("Due date is required");
      if (form.line_items.some(l => !l.description || !l.unit_price)) throw new Error("Fill all line items");

      await authApi("/api/v1/invoices", {
        method: "POST",
        body: JSON.stringify({
          client_id: form.client_id,
          issue_date: `${form.issue_date}T00:00:00Z`,
          due_date: `${form.due_date}T00:00:00Z`,
          notes: form.notes || undefined,
          payment_terms: form.payment_terms || undefined,
          line_items: form.line_items.map(l => ({
            description: l.description, quantity: l.quantity,
            unit_price: l.unit_price, tax_percent: l.tax_percent, discount_percent: l.discount_percent,
          })),
        }),
      });
      setShowCreate(false); load();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const issueInvoice = async (id: string) => {
    try { await authApi(`/api/v1/invoices/${id}/issue`, { method: "POST" }); load(); } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Invoices</h1>
          <p className="text-sm text-charcoal-400 mt-1">{invoices.total} invoice{invoices.total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "draft", "issued", "partially_paid", "paid", "overdue"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusFilter === s ? "bg-forest-50 border-forest-300 text-forest-700" : "bg-white border-sage-200 text-charcoal-500 hover:bg-sage-50"}`}>
            {s ? s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) : "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-sage-100 rounded-xl animate-pulse" />)}</div>
      ) : invoices.items.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-charcoal-200 mx-auto mb-4" />
          <p className="text-sm font-medium text-charcoal-600">No invoices yet</p>
          <p className="text-xs text-charcoal-400 mt-1">Create your first invoice to start tracking revenue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-sage-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sage-100 bg-sage-50/50">
                <th className="text-left px-5 py-3 font-medium text-charcoal-500">Invoice</th>
                <th className="text-left px-5 py-3 font-medium text-charcoal-500">Client</th>
                <th className="text-left px-5 py-3 font-medium text-charcoal-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-charcoal-500">Total</th>
                <th className="text-right px-5 py-3 font-medium text-charcoal-500">Balance</th>
                <th className="text-left px-5 py-3 font-medium text-charcoal-500">Due</th>
                <th className="text-right px-5 py-3 font-medium text-charcoal-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {invoices.items.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-sage-50/30">
                  <td className="px-5 py-3 font-semibold text-charcoal-800">{inv.invoice_number}</td>
                  <td className="px-5 py-3 text-charcoal-600">{inv.client?.name || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(inv.status)}`}>
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-charcoal-800">{formatCurrency(inv.total, inv.currency)}</td>
                  <td className="px-5 py-3 text-right font-medium text-charcoal-600">{formatCurrency(inv.balance_due, inv.currency)}</td>
                  <td className="px-5 py-3 text-charcoal-500">{formatDate(inv.due_date)}</td>
                  <td className="px-5 py-3 text-right">
                    {inv.status === "draft" && (
                      <button onClick={() => issueInvoice(inv.id)} className="text-xs font-medium text-forest-600 hover:text-forest-800 bg-forest-50 px-3 py-1 rounded-lg">Issue</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-charcoal-900">New Invoice</h2>
              <button onClick={() => setShowCreate(false)} className="text-charcoal-400 hover:text-charcoal-600"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="bg-error/10 text-error text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">Client *</label>
                <select value={form.client_id} onChange={(e) => setForm({...form, client_id: e.target.value})} required
                  className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm">
                  <option value="">Select client…</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">Issue Date</label>
                  <input type="date" value={form.issue_date} onChange={(e) => setForm({...form, issue_date: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">Due Date *</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({...form, due_date: e.target.value})} required
                    className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">Line Items</label>
                <div className="space-y-3">
                  {form.line_items.map((line, i) => (
                    <div key={i} className="flex gap-2 items-start bg-sage-50 p-3 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input placeholder="Description *" value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-sage-300 bg-white text-sm" />
                        <div className="grid grid-cols-4 gap-2">
                          <input placeholder="Qty" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} type="number" step="0.01" min="0"
                            className="px-3 py-2 rounded-lg border border-sage-300 bg-white text-sm" />
                          <input placeholder="Unit Price *" value={line.unit_price} onChange={(e) => updateLine(i, "unit_price", e.target.value)} type="number" step="0.01" min="0"
                            className="px-3 py-2 rounded-lg border border-sage-300 bg-white text-sm" />
                          <input placeholder="Tax %" value={line.tax_percent} onChange={(e) => updateLine(i, "tax_percent", e.target.value)} type="number" step="0.01" min="0" max="100"
                            className="px-3 py-2 rounded-lg border border-sage-300 bg-white text-sm" />
                          <input placeholder="Discount %" value={line.discount_percent} onChange={(e) => updateLine(i, "discount_percent", e.target.value)} type="number" step="0.01" min="0" max="100"
                            className="px-3 py-2 rounded-lg border border-sage-300 bg-white text-sm" />
                        </div>
                      </div>
                      {form.line_items.length > 1 && (
                        <button type="button" onClick={() => removeLine(i)} className="text-charcoal-400 hover:text-error mt-1"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addLine} className="mt-2 text-sm text-forest-600 font-medium hover:text-forest-700 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Line
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" placeholder="Payment instructions or notes…" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-sage-300 text-sm font-medium text-charcoal-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold">{saving ? "Creating…" : "Create Invoice"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
