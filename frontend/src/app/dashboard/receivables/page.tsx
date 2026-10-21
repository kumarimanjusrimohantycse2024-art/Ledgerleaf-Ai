"use client";
import { useEffect, useState } from "react";
import { DollarSign, Clock, AlertTriangle } from "lucide-react";
import { authApi, formatCurrency, formatDate, getStatusColor } from "@/lib/api";

export default function ReceivablesPage() {
  const [invoices, setInvoices] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi("/api/v1/invoices?status=issued").then((issued: any) => {
      authApi("/api/v1/invoices?status=partially_paid").then((partial: any) => {
        authApi("/api/v1/invoices?status=overdue").then((overdue: any) => {
          const all = [...(issued.items || []), ...(partial.items || []), ...(overdue.items || [])];
          setInvoices({ items: all, total: all.length });
          setLoading(false);
        });
      });
    }).catch(() => setLoading(false));
  }, []);

  const totalOutstanding = invoices.items.reduce((s: number, i: any) => s + parseFloat(i.balance_due || 0), 0);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-charcoal-900">Receivables</h1><p className="text-sm text-charcoal-400 mt-1">Track outstanding and overdue client payments</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Total Outstanding</p><p className="text-2xl font-bold text-charcoal-900 mt-1">{formatCurrency(totalOutstanding)}</p></div>
        <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Invoices Awaiting Payment</p><p className="text-2xl font-bold text-charcoal-900 mt-1">{invoices.total}</p></div>
        <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Overdue</p><p className="text-2xl font-bold text-error mt-1">{invoices.items.filter((i: any) => i.status === "overdue").length}</p></div>
      </div>
      {loading ? <div className="h-40 bg-sage-100 rounded-xl animate-pulse" />
      : invoices.items.length === 0 ? <div className="text-center py-16"><DollarSign className="w-12 h-12 text-charcoal-200 mx-auto mb-4" /><p className="text-sm font-medium text-charcoal-600">No outstanding receivables</p></div>
      : (
        <div className="bg-white rounded-xl border border-sage-200 overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b border-sage-100 bg-sage-50/50"><th className="text-left px-5 py-3 font-medium text-charcoal-500">Invoice</th><th className="text-left px-5 py-3 font-medium text-charcoal-500">Client</th><th className="text-left px-5 py-3 font-medium text-charcoal-500">Status</th><th className="text-left px-5 py-3 font-medium text-charcoal-500">Due</th><th className="text-right px-5 py-3 font-medium text-charcoal-500">Balance</th></tr></thead>
          <tbody className="divide-y divide-sage-100">{invoices.items.map((inv: any) => (
            <tr key={inv.id} className="hover:bg-sage-50/30"><td className="px-5 py-3 font-medium text-charcoal-800">{inv.invoice_number}</td><td className="px-5 py-3 text-charcoal-600">{inv.client?.name || "—"}</td><td className="px-5 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(inv.status)}`}>{inv.status.replace("_"," ")}</span></td><td className="px-5 py-3 text-charcoal-500">{formatDate(inv.due_date)}</td><td className="px-5 py-3 text-right font-semibold text-charcoal-800">{formatCurrency(inv.balance_due)}</td></tr>
          ))}</tbody></table>
        </div>
      )}
    </div>
  );
}
