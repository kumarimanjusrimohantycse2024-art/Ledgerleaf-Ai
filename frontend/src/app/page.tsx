"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FileText, Shield, Bot, CheckCircle, ArrowRight, BarChart3,
  Receipt, Users, Clock, TrendingUp, Menu, X, Leaf, ChevronDown, ChevronUp,
  DollarSign, Eye, Lock, Zap, Bell, FileCheck
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   LedgerLeaf AI — Landing Page
   ═══════════════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const FEATURES = [
  { icon: Bot, title: "AI Finance Assistant", desc: "Ask questions about your finances in natural language. Every answer is grounded in your actual records." },
  { icon: FileText, title: "Invoice Management", desc: "Create, send, and track invoices with real-time payment status. Automated reminders with human approval." },
  { icon: Receipt, title: "Expense Tracking", desc: "Upload receipts, auto-extract details with AI, and categorize expenses. Always with human review." },
  { icon: TrendingUp, title: "Cash Flow Intelligence", desc: "Transparent, rule-based cash flow projections. Model scenarios and plan ahead with clarity." },
  { icon: Shield, title: "Approval Controls", desc: "AI proposes. Humans decide. Every consequential action requires explicit approval before execution." },
  { icon: BarChart3, title: "Financial Reports", desc: "Income summaries, receivables, expense breakdowns. All calculated from your real data." },
  { icon: Users, title: "Team Workspace", desc: "Role-based access for owners, managers, and team members. Full audit trail for every action." },
  { icon: Lock, title: "Secure by Design", desc: "Tenant isolation, encrypted storage, server-side authorization. Your data stays yours." },
];

const WORKFLOW_STEPS = [
  { num: "01", title: "Upload & Organize", desc: "Upload invoices, receipts, and financial documents. AI extracts key details for your review.", icon: FileCheck },
  { num: "02", title: "Ask Your AI Assistant", desc: "\"Which invoices are overdue?\" — Get precise answers linked to source records.", icon: Bot },
  { num: "03", title: "Review & Approve", desc: "AI proposes actions like payment reminders or expense categorizations. You review and approve.", icon: Eye },
  { num: "04", title: "Track & Report", desc: "Dashboard and reports built from real data. Cash flow projections with transparent assumptions.", icon: BarChart3 },
];

const PRICING = [
  {
    name: "Starter", price: "₹999", period: "/month", desc: "For solo consultants and freelancers",
    features: ["Unlimited invoices & expenses", "5 clients", "Basic AI assistant (100 queries/mo)", "Receipt scanning", "CSV exports"],
    cta: "Start Free Trial", highlight: false,
  },
  {
    name: "Agency", price: "₹2,999", period: "/month", desc: "For growing agencies and studios",
    features: ["Everything in Starter", "Unlimited clients", "Full AI assistant (500 queries/mo)", "Approval workflows", "Receivables tracking", "Team workspace (5 members)", "Cash flow scenarios"],
    cta: "Start Free Trial", highlight: true,
  },
  {
    name: "Growth", price: "₹7,999", period: "/month", desc: "For established businesses",
    features: ["Everything in Agency", "Advanced reports", "AI assistant (2000 queries/mo)", "Team workspace (20 members)", "Priority support", "Custom categories", "API access"],
    cta: "Contact Sales", highlight: false,
  },
];

const FAQ = [
  { q: "Does the AI have access to my bank accounts?", a: "No. LedgerLeaf AI works only with records you upload or enter. We do not connect to bank accounts in the current version. All financial data is explicitly provided by you." },
  { q: "Can the AI send emails or take actions on its own?", a: "No. The AI can propose actions — like drafting a payment reminder — but every consequential action requires explicit human approval before execution." },
  { q: "How is my financial data protected?", a: "All data is encrypted in transit and at rest. Each organization's data is isolated at the database level. We use server-side authorization for every API call. We never share your data with third parties." },
  { q: "Is this a replacement for my accountant?", a: "No. LedgerLeaf AI is a management tool that helps you organize and understand your financial records. It does not provide tax advice, regulatory compliance, or statutory accounting services." },
  { q: "Are these prices final?", a: "These prices are initial hypotheses. We're actively gathering feedback from early customers. Pricing may change before general availability." },
  { q: "What currencies are supported?", a: "LedgerLeaf AI supports any ISO currency code. Each organization can set a default currency, and individual invoices can use different currencies. We never silently combine amounts in different currencies." },
];

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-forest-800">LedgerLeaf</span>
              <span className="text-xs font-medium bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full">AI</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} href={item.href} className="text-sm font-medium text-charcoal-600 hover:text-forest-700">
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-charcoal-600 hover:text-forest-700 px-4 py-2">
                Sign In
              </Link>
              <Link href="/register" className="text-sm font-semibold bg-forest-600 hover:bg-forest-700 text-white px-5 py-2.5 rounded-lg shadow-sm">
                Get Started
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-sage-200 px-4 py-4 space-y-3">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className="block text-sm font-medium text-charcoal-600 py-2" onClick={() => setMobileMenu(false)}>
                {item.label}
              </a>
            ))}
            <div className="pt-3 border-t border-sage-100 flex gap-3">
              <Link href="/login" className="flex-1 text-center text-sm font-medium text-charcoal-600 border border-sage-300 px-4 py-2.5 rounded-lg">Sign In</Link>
              <Link href="/register" className="flex-1 text-center text-sm font-semibold bg-forest-600 text-white px-4 py-2.5 rounded-lg">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest-50 via-cream-50 to-sage-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-forest-100 text-forest-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              AI-Powered Financial Operations
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-charcoal-900 leading-tight tracking-tight">
              Less paperwork.<br />
              <span className="text-forest-600">Clearer finances.</span><br />
              Smarter decisions.
            </h1>
            <p className="mt-6 text-lg text-charcoal-500 max-w-2xl leading-relaxed">
              LedgerLeaf AI helps agencies and service businesses understand their financial records,
              manage invoices, track expenses, and anticipate cash-flow issues — with an AI assistant
              that always defers to human judgment for important decisions.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/register" className="inline-flex items-center gap-2 bg-forest-600 hover:bg-forest-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-forest-600/20 text-base">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 bg-white hover:bg-sage-50 text-charcoal-700 font-semibold px-8 py-3.5 rounded-xl border border-sage-300 text-base">
                See How It Works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-charcoal-400">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-forest-500" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-forest-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-forest-500" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Preview ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-24">
        <div className="bg-white rounded-2xl shadow-xl shadow-charcoal-900/5 border border-sage-200 overflow-hidden">
          <div className="bg-charcoal-900 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-error/80" />
              <div className="w-3 h-3 rounded-full bg-warning/80" />
              <div className="w-3 h-3 rounded-full bg-success/80" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-charcoal-400 font-mono">app.ledgerleaf.ai</span>
            </div>
          </div>
          <div className="p-6 lg:p-8 bg-cream-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Revenue This Month", value: "₹4,85,000", change: "+12.5%", up: true },
                { label: "Outstanding Receivables", value: "₹2,10,000", change: "3 invoices", up: false },
                { label: "Net Income", value: "₹3,22,500", change: "+8.2%", up: true },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl p-5 border border-sage-200">
                  <p className="text-sm text-charcoal-400 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-charcoal-900 mt-1">{card.value}</p>
                  <p className={`text-xs mt-1 font-medium ${card.up ? "text-success" : "text-warning"}`}>
                    {card.change} <span className="text-charcoal-300">• Demo Data</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-sage-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-forest-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-forest-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal-800">AI Assistant</p>
                  <p className="text-xs text-charcoal-400">Grounded in your records</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-sage-50 rounded-lg p-3 max-w-md">
                  <p className="text-sm text-charcoal-700">Which invoices are overdue?</p>
                </div>
                <div className="bg-forest-50 rounded-lg p-3 max-w-lg border border-forest-100">
                  <p className="text-sm text-charcoal-700">You have <strong>2 overdue invoices</strong> totaling <strong>₹1,40,000</strong>:</p>
                  <ul className="mt-2 text-sm text-charcoal-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-error" />
                      INV-00012 — Acme Corp — ₹85,000 (14 days overdue)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                      INV-00015 — TechFlow — ₹55,000 (3 days overdue)
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-charcoal-400 italic">Source: Invoice records as of today • Demo data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal-900">Everything you need to manage agency finances</h2>
          <p className="mt-4 text-lg text-charcoal-500 max-w-2xl mx-auto">Built for clarity, accuracy, and trust. Every feature designed with real agency workflows in mind.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-6 border border-sage-200 hover:border-forest-300 hover:shadow-lg hover:shadow-forest-600/5 group">
              <div className="w-10 h-10 bg-forest-100 group-hover:bg-forest-200 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-forest-600" />
              </div>
              <h3 className="text-base font-semibold text-charcoal-800 mb-2">{f.title}</h3>
              <p className="text-sm text-charcoal-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal-900">How LedgerLeaf AI works</h2>
            <p className="mt-4 text-lg text-charcoal-500">Simple, transparent, human-controlled</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.num} className="relative">
                <div className="text-5xl font-black text-forest-100 mb-4">{step.num}</div>
                <div className="w-10 h-10 bg-forest-600 rounded-lg flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-charcoal-800 mb-2">{step.title}</h3>
                <p className="text-sm text-charcoal-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Approval Controls (Differentiator) ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-gradient-to-br from-forest-800 to-forest-900 rounded-2xl p-8 lg:p-12 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-forest-700/30 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 text-forest-200 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Shield className="w-4 h-4" /> Core Differentiator
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">AI proposes. Humans approve.</h2>
            <p className="text-forest-200 text-lg leading-relaxed mb-8">
              Unlike tools that let AI act autonomously, LedgerLeaf AI always shows you the exact action,
              target, and consequences before execution. Every payment reminder, every categorization change,
              every client communication — reviewed and approved by a real human.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Eye, label: "Full Transparency", desc: "See exactly what the AI proposes" },
                { icon: Lock, label: "Explicit Approval", desc: "No action without your consent" },
                { icon: FileCheck, label: "Complete Audit Trail", desc: "Every decision is recorded" },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 rounded-xl p-4">
                  <item.icon className="w-5 h-5 text-forest-300 mb-2" />
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-forest-300 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal-900">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-charcoal-500">Start free. Scale as you grow.</p>
            <p className="mt-2 text-sm text-charcoal-400 bg-warning/10 text-warning inline-block px-3 py-1 rounded-full">
              Prices are initial hypotheses and may change before general availability
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.highlight
                    ? "border-forest-400 bg-forest-50 shadow-xl shadow-forest-600/10 relative"
                    : "border-sage-200 bg-white"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-forest-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-charcoal-800">{plan.name}</h3>
                <p className="text-sm text-charcoal-400 mt-1">{plan.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-charcoal-900">{plan.price}</span>
                  <span className="text-charcoal-400">{plan.period}</span>
                </div>
                <button
                  className={`w-full mt-8 py-3 rounded-xl font-semibold text-sm ${
                    plan.highlight
                      ? "bg-forest-600 hover:bg-forest-700 text-white shadow-sm"
                      : "bg-charcoal-900 hover:bg-charcoal-800 text-white"
                  }`}
                >
                  {plan.cta}
                </button>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-charcoal-600">
                      <CheckCircle className="w-4 h-4 text-forest-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-charcoal-900 text-center mb-12">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-sage-200">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-semibold text-charcoal-800 pr-4">{item.q}</span>
                {openFaq === i ? <ChevronUp className="w-5 h-5 text-charcoal-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-charcoal-400 flex-shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-sm text-charcoal-500 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-forest-800 to-forest-900 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to simplify your finances?</h2>
          <p className="text-forest-200 text-lg mb-8">Start your 14-day free trial. No credit card required.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-forest-800 font-semibold px-8 py-3.5 rounded-xl hover:bg-forest-50 text-base shadow-lg">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-charcoal-900 text-charcoal-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">LedgerLeaf AI</span>
              </div>
              <p className="text-sm text-charcoal-400 leading-relaxed">
                Less paperwork. Clearer finances. Smarter decisions.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@ledgerleaf.ai" className="hover:text-white">support@ledgerleaf.ai</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-charcoal-700 text-center text-sm text-charcoal-500">
            © 2026 LedgerLeaf AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
