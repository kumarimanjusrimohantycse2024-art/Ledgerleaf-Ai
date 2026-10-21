"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { authApi, formatCurrency, formatDate } from "@/lib/api";

export default function TransactionsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = filter ? `?transaction_type=${filter}` : "";
    authApi(`/api/v1/transactions${params}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-charcoal-900">Transactions</h1><p className="text-sm text-charcoal-400 mt-1">{data.total} transaction{data.total !== 1 ? "s" : ""}</p></div>
      <div className="flex gap-2">
        {["", "income", "expense"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${filter === f ? "bg-forest-50 border-forest-300 text-forest-700" : "bg-white border-sage-200 text-charcoal-500"}`}>
            {f ? f.charAt(0).toUpperCase() + f.slice(1) : "All"}
          </button>
        ))}
      </div>
      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-sage-100 rounded-xl animate-pulse" />)}</div>
      : data.items.length === 0 ? (
        <div className="text-center py-16"><ArrowLeftRight className="w-12 h-12 text-charcoal-200 mx-auto mb-4" /><p className="text-sm font-medium text-charcoal-600">No transactions yet</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-sage-200 divide-y divide-sage-100">
          {data.items.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-sage-50/30">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.transaction_type === "income" ? "bg-forest-100" : "bg-error/10"}`}>
                  {t.transaction_type === "income" ? <ArrowUpRight className="w-4 h-4 text-forest-600" /> : <ArrowDownRight className="w-4 h-4 text-error" />}
                </div>
                <div><p className="text-sm font-medium text-charcoal-700">{t.description}</p><p className="text-xs text-charcoal-400">{formatDate(t.transaction_date)}</p></div>
              </div>
              <p className={`text-sm font-semibold ${t.transaction_type === "income" ? "text-forest-700" : "text-error"}`}>
                {t.transaction_type === "income" ? "+" : "-"}{formatCurrency(t.amount, t.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
