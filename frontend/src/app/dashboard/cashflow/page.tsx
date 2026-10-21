"use client";
import { TrendingUp, Info } from "lucide-react";
export default function CashFlowPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-charcoal-900">Cash Flow Forecast</h1><p className="text-sm text-charcoal-400 mt-1">Transparent, rule-based projections based on your records</p></div>
      <div className="bg-info/5 border border-info/20 rounded-xl px-5 py-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
        <div><p className="text-sm font-medium text-charcoal-800">How cash flow projections work</p><p className="text-xs text-charcoal-500 mt-1">Projections are based on: (1) unpaid issued invoices by due date, (2) recurring expenses based on historical patterns, (3) known upcoming obligations. All assumptions are listed transparently.</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Expected Inflow (30d)</p><p className="text-2xl font-bold text-forest-700 mt-1">Based on outstanding invoices</p><p className="text-xs text-charcoal-400 mt-1">Sum of balance_due on issued invoices due within 30 days</p></div>
        <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Expected Outflow (30d)</p><p className="text-2xl font-bold text-error mt-1">Based on expense trends</p><p className="text-xs text-charcoal-400 mt-1">Average of last 3 months approved expenses</p></div>
        <div className="bg-white rounded-xl p-5 border border-sage-200"><p className="text-sm text-charcoal-400">Net Cash Position</p><p className="text-2xl font-bold text-charcoal-900 mt-1">Inflow − Outflow</p><p className="text-xs text-charcoal-400 mt-1">Deterministic calculation, not AI prediction</p></div>
      </div>
      <div className="bg-white rounded-xl border border-sage-200 p-8 text-center">
        <TrendingUp className="w-12 h-12 text-charcoal-200 mx-auto mb-4" />
        <p className="text-sm font-medium text-charcoal-600">Cash flow chart coming soon</p>
        <p className="text-xs text-charcoal-400 mt-1">Add more transactions to enable 30/60/90-day forecasting with transparent assumptions.</p>
      </div>
    </div>
  );
}
