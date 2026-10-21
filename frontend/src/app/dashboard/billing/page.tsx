"use client";
import { CreditCard, CheckCircle, Zap } from "lucide-react";
export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-charcoal-900">Billing & Subscription</h1><p className="text-sm text-charcoal-400 mt-1">Manage your LedgerLeaf AI subscription</p></div>
      <div className="bg-white rounded-xl border border-sage-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center"><Zap className="w-5 h-5 text-forest-600" /></div>
          <div><p className="text-sm font-semibold text-charcoal-800">Free Trial</p><p className="text-xs text-charcoal-400">14 days remaining</p></div>
        </div>
        <div className="bg-sage-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-charcoal-600">You&apos;re on the <strong>Agency</strong> plan trial with full feature access.</p>
          <ul className="mt-3 space-y-2">{["Unlimited invoices & expenses","Full AI assistant","Approval workflows","Team workspace"].map(f => <li key={f} className="text-xs text-charcoal-500 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-forest-500" />{f}</li>)}</ul>
        </div>
        <button className="bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl">Upgrade to Paid Plan</button>
      </div>
    </div>
  );
}
