"use client";
import { useEffect, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import { authApi, formatCurrency } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { authApi("/api/v1/dashboard").then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);

  const monthNames = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const trendData = data?.monthly_trends?.map((m: any) => ({ month: monthNames[m.month], Income: m.income, Expenses: m.expenses, Profit: m.income - m.expenses })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-charcoal-900">Reports</h1><p className="text-sm text-charcoal-400 mt-1">Financial summaries calculated from your records</p></div>
        <button className="flex items-center gap-2 bg-white hover:bg-sage-50 text-charcoal-700 text-sm font-medium px-4 py-2.5 rounded-xl border border-sage-300"><Download className="w-4 h-4" /> Export CSV</button>
      </div>
      {loading ? <div className="h-60 bg-sage-100 rounded-xl animate-pulse" /> : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Revenue</p><p className="text-xl font-bold text-charcoal-900 mt-1">{formatCurrency(data.total_income, data.currency)}</p></div>
            <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Expenses</p><p className="text-xl font-bold text-charcoal-900 mt-1">{formatCurrency(data.total_expenses, data.currency)}</p></div>
            <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Net Income</p><p className="text-xl font-bold text-charcoal-900 mt-1">{formatCurrency(data.net_income, data.currency)}</p></div>
            <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Outstanding</p><p className="text-xl font-bold text-charcoal-900 mt-1">{formatCurrency(data.outstanding_receivables, data.currency)}</p></div>
          </div>
          {trendData.length > 0 && (
            <div className="bg-white rounded-xl border border-sage-200 p-6">
              <h2 className="text-sm font-semibold text-charcoal-800 mb-4">Monthly Profit & Loss</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#E8F0ED" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: "#72728A" }} /><YAxis tick={{ fontSize: 12, fill: "#72728A" }} /><Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} /><Bar dataKey="Income" fill="#22764E" radius={[4,4,0,0]} /><Bar dataKey="Expenses" fill="#DC2626" radius={[4,4,0,0]} /><Bar dataKey="Profit" fill="#2563EB" radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : <div className="text-center py-16"><BarChart3 className="w-12 h-12 text-charcoal-200 mx-auto mb-4" /><p className="text-sm text-charcoal-600">No data available</p></div>}
    </div>
  );
}
