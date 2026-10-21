"use client";

import { useEffect, useState } from "react";
import { Plus, Receipt, X } from "lucide-react";
import { authApi, formatCurrency, formatDate, getStatusColor } from "@/lib/api";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any>({ items: [], total: 0 });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ description: "", merchant: "", amount: "", tax_amount: "0", expense_date: "", category_id: "", payment_method: "", notes: "" });

  const load = () => { setLoading(true); authApi("/api/v1/expenses").then(setExpenses).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); authApi<any[]>("/api/v1/categories").then(setCategories).catch(() => {}); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (!form.description || !form.amount) throw new Error("Description and amount required");
      await authApi("/api/v1/expenses", { method: "POST", body: JSON.stringify({ ...form, amount: form.amount, tax_amount: form.tax_amount || "0", expense_date: `${form.expense_date}T00:00:00Z`, category_id: form.category_id || undefined }) });
      setShowCreate(false); load();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const approve = async (id: string) => { try { await authApi(`/api/v1/expenses/${id}`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) }); load(); } catch (e: any) { alert(e.message); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-charcoal-900">Expenses</h1><p className="text-sm text-charcoal-400 mt-1">{expenses.total} expense{expenses.total !== 1 ? "s" : ""}</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"><Plus className="w-4 h-4" /> Add Expense</button>
      </div>

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-sage-100 rounded-xl animate-pulse" />)}</div>
      : expenses.items.length === 0 ? (
        <div className="text-center py-16"><Receipt className="w-12 h-12 text-charcoal-200 mx-auto mb-4" /><p className="text-sm font-medium text-charcoal-600">No expenses yet</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-sage-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-sage-100 bg-sage-50/50">
              <th className="text-left px-5 py-3 font-medium text-charcoal-500">Description</th>
              <th className="text-left px-5 py-3 font-medium text-charcoal-500">Merchant</th>
              <th className="text-left px-5 py-3 font-medium text-charcoal-500">Date</th>
              <th className="text-left px-5 py-3 font-medium text-charcoal-500">Status</th>
              <th className="text-right px-5 py-3 font-medium text-charcoal-500">Amount</th>
              <th className="text-right px-5 py-3 font-medium text-charcoal-500">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-sage-100">
              {expenses.items.map((ex: any) => (
                <tr key={ex.id} className="hover:bg-sage-50/30">
                  <td className="px-5 py-3 font-medium text-charcoal-800">{ex.description}</td>
                  <td className="px-5 py-3 text-charcoal-600">{ex.merchant || "—"}</td>
                  <td className="px-5 py-3 text-charcoal-500">{formatDate(ex.expense_date)}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(ex.status)}`}>{ex.status.replace("_", " ")}</span></td>
                  <td className="px-5 py-3 text-right font-medium text-charcoal-800">{formatCurrency(ex.amount, ex.currency)}</td>
                  <td className="px-5 py-3 text-right">{ex.status === "pending_review" && <button onClick={() => approve(ex.id)} className="text-xs font-medium text-forest-600 bg-forest-50 px-3 py-1 rounded-lg">Approve</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-charcoal-900">Add Expense</h2><button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-charcoal-400" /></button></div>
            {error && <div className="bg-error/10 text-error text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium text-charcoal-700 mb-1">Description *</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} required className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" placeholder="Cloud hosting" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-charcoal-700 mb-1">Amount *</label><input value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} type="number" step="0.01" min="0" required className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" /></div>
                <div><label className="block text-sm font-medium text-charcoal-700 mb-1">Merchant</label><input value={form.merchant} onChange={e => setForm({...form, merchant: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" placeholder="AWS" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-charcoal-700 mb-1">Date</label><input type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" /></div>
                <div><label className="block text-sm font-medium text-charcoal-700 mb-1">Category</label><select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm"><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-sage-300 text-sm font-medium text-charcoal-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold">{saving ? "Saving…" : "Add Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
