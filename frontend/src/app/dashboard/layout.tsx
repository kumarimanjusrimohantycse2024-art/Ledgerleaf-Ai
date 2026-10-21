"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3, Bot, FileText, Users, Receipt, ArrowLeftRight, FolderOpen,
  DollarSign, TrendingUp, ClipboardCheck, Shield, Settings, HelpCircle,
  Leaf, LogOut, ChevronDown, Menu, X, LayoutDashboard, CreditCard
} from "lucide-react";
import { getToken, removeToken, getOrgId, api } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Assistant", href: "/dashboard/assistant", icon: Bot },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { label: "Documents", href: "/dashboard/documents", icon: FolderOpen },
  { label: "Receivables", href: "/dashboard/receivables", icon: DollarSign },
  { label: "Cash Flow", href: "/dashboard/cashflow", icon: TrendingUp },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Approvals", href: "/dashboard/approvals", icon: ClipboardCheck },
  { label: "Team", href: "/dashboard/team", icon: Shield },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const orgId = getOrgId();
    if (!orgId) { router.push("/onboarding"); return; }

    api("/api/v1/auth/me", { token }).then(setUser).catch(() => {
      removeToken(); router.push("/login");
    });
    api("/api/v1/auth/organizations", { token }).then((orgs: any) => {
      const current = orgs.find((o: any) => o.id === orgId);
      if (current) setOrg(current);
    }).catch(() => {});
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-sage-200 transform transition-transform lg:translate-x-0 lg:static lg:flex-shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-sage-100">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-forest-800">LedgerLeaf</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-charcoal-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Org switcher */}
          {org && (
            <div className="px-4 py-3 border-b border-sage-100">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sage-50">
                <div className="w-7 h-7 bg-forest-100 rounded-md flex items-center justify-center text-xs font-bold text-forest-700">
                  {org.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal-800 truncate">{org.name}</p>
                  <p className="text-xs text-charcoal-400">{org.currency}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-forest-50 text-forest-700 border border-forest-200"
                      : "text-charcoal-500 hover:bg-sage-50 hover:text-charcoal-700"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-4.5 h-4.5 ${active ? "text-forest-600" : "text-charcoal-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          {user && (
            <div className="border-t border-sage-100 p-4">
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-sage-50 text-left">
                  <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center text-sm font-bold text-forest-700">
                    {user.full_name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-700 truncate">{user.full_name}</p>
                    <p className="text-xs text-charcoal-400 truncate">{user.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-charcoal-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg border border-sage-200 py-1">
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-charcoal-600 hover:bg-sage-50">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-sage-200 h-16 flex items-center px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 text-charcoal-500">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link href="/dashboard/assistant" className="flex items-center gap-2 bg-forest-50 hover:bg-forest-100 text-forest-700 text-sm font-medium px-4 py-2 rounded-lg border border-forest-200">
            <Bot className="w-4 h-4" /> Ask AI
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
