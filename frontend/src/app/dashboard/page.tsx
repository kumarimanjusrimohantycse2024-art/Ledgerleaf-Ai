"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Clock, AlertTriangle,
  ClipboardCheck, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { authApi, formatCurrency } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#22764E", "#2563EB", "#D97706", "#DC2626", "#7C3AED", "#059669", "#6B7280", "#9CA3AF"];

function StatCard({ label, value, icon: Icon, trend, color }: {
  label: string; value: string; icon: any; trend?: string; color: string;
}) {
  const isPositive = trend?.startsWith("+");
  return (
    <div className="bg-white rounded-xl p-5 border border-sage-200 hover:shadow-md hover:border-sage-300 transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-charcoal-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-charcoal-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${isPositive ? "text-success" : "text-error"}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        <FileText className="w-6 h-6 text-charcoal-300" />
      </div>
      <p className="text-sm font-medium text-charcoal-600">{title}</p>
      <p className="text-xs text-charcoal-400 mt-1">{desc}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi("/api/v1/dashboard")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-sage-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-sage-100 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-sage-100 rounded-xl" />
          <div className="h-80 bg-sage-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 text-error text-sm px-6 py-4 rounded-xl">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="mt-1 text-error/70">{error}</p>
        <p className="mt-2 text-xs text-charcoal-400">Make sure the backend is running at {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</p>
      </div>
    );
  }

  const d = data!;
  const currency = d.currency || "INR";

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = (d.monthly_trends || []).map((m: any) => ({
    month: monthNames[m.month] || `M${m.month}`,
    Income: m.income,
    Expenses: m.expenses,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal-900">Financial Overview</h1>
        <p className="text-sm text-charcoal-400 mt-1">
          {d.period_start && d.period_end
            ? `${new Date(d.period_start).toLocaleDateString()} — ${new Date(d.period_end).toLocaleDateString()}`
            : "Current period"}
          {" · "}{currency}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={formatCurrency(d.total_income, currency)} icon={TrendingUp} color="bg-forest-100 text-forest-600" />
        <StatCard label="Total Expenses" value={formatCurrency(d.total_expenses, currency)} icon={TrendingDown} color="bg-error/10 text-error" />
        <StatCard label="Net Income" value={formatCurrency(d.net_income, currency)} icon={DollarSign}
          color={parseFloat(d.net_income) >= 0 ? "bg-forest-100 text-forest-600" : "bg-error/10 text-error"} />
        <StatCard label="Outstanding Receivables" value={formatCurrency(d.outstanding_receivables, currency)} icon={Clock} color="bg-warning/10 text-warning" />
      </div>

      {/* Alert: overdue invoices */}
      {d.overdue_invoices_count > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-charcoal-800">
              {d.overdue_invoices_count} overdue invoice{d.overdue_invoices_count > 1 ? "s" : ""} totaling {formatCurrency(d.overdue_invoices_amount, currency)}
            </p>
            <p className="text-xs text-charcoal-400 mt-0.5">Review and send payment reminders to recover outstanding amounts.</p>
          </div>
        </div>
      )}

      {d.pending_approvals_count > 0 && (
        <div className="bg-info/5 border border-info/20 rounded-xl px-5 py-4 flex items-start gap-3">
          <ClipboardCheck className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-charcoal-800">
              {d.pending_approvals_count} pending approval{d.pending_approvals_count > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-charcoal-400 mt-0.5">Review proposed actions in the Approvals tab.</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trends */}
        <div className="bg-white rounded-xl border border-sage-200 p-6">
          <h2 className="text-sm font-semibold text-charcoal-800 mb-4">Monthly Income vs Expenses</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F0ED" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#72728A" }} />
                <YAxis tick={{ fontSize: 12, fill: "#72728A" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #CAE0D9", fontSize: 13 }} />
                <Bar dataKey="Income" fill="#22764E" radius={[4,4,0,0]} />
                <Bar dataKey="Expenses" fill="#DC2626" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No data yet" desc="Transactions will appear here as you record income and expenses." />
          )}
        </div>

        {/* Expense by category */}
        <div className="bg-white rounded-xl border border-sage-200 p-6">
          <h2 className="text-sm font-semibold text-charcoal-800 mb-4">Expenses by Category</h2>
          {(d.expense_by_category || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={d.expense_by_category} dataKey="total" nameKey="name" cx="50%" cy="50%"
                  outerRadius={90} innerRadius={50} paddingAngle={2} label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  } labelLine={false} style={{ fontSize: 11 }}>
                  {d.expense_by_category.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No categorized expenses" desc="Approve expenses with categories to see the breakdown." />
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-sage-200">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-sm font-semibold text-charcoal-800">Recent Transactions</h2>
        </div>
        {(d.recent_transactions || []).length > 0 ? (
          <div className="divide-y divide-sage-100">
            {d.recent_transactions.map((txn: any) => (
              <div key={txn.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    txn.transaction_type === "income" ? "bg-forest-100" : "bg-error/10"
                  }`}>
                    {txn.transaction_type === "income"
                      ? <ArrowUpRight className="w-4 h-4 text-forest-600" />
                      : <ArrowDownRight className="w-4 h-4 text-error" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal-700 truncate max-w-xs">{txn.description}</p>
                    <p className="text-xs text-charcoal-400">{new Date(txn.transaction_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${txn.transaction_type === "income" ? "text-forest-700" : "text-error"}`}>
                  {txn.transaction_type === "income" ? "+" : "-"}{formatCurrency(txn.amount, txn.currency)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="No transactions yet" desc="Payments and approved expenses will show up here." />
          </div>
        )}
      </div>
    </div>
  );
}
