"use client";
import { Settings as SettingsIcon, Building2, Globe, Bell, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => { authApi("/api/v1/auth/me").then(setProfile).catch(() => {}); }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-charcoal-900">Settings</h1><p className="text-sm text-charcoal-400 mt-1">Account and workspace preferences</p></div>

      <div className="bg-white rounded-xl border border-sage-200 p-6">
        <h2 className="text-sm font-semibold text-charcoal-800 flex items-center gap-2 mb-4"><Building2 className="w-4 h-4" /> Profile</h2>
        <div className="space-y-3">
          <div><label className="block text-xs font-medium text-charcoal-500 mb-1">Full Name</label><input defaultValue={profile?.full_name} className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-charcoal-500 mb-1">Email</label><input defaultValue={profile?.email} disabled className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-charcoal-50 text-sm text-charcoal-400" /></div>
        </div>
        <button className="mt-4 bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">Save Changes</button>
      </div>

      <div className="bg-white rounded-xl border border-sage-200 p-6">
        <h2 className="text-sm font-semibold text-charcoal-800 flex items-center gap-2 mb-4"><Globe className="w-4 h-4" /> Workspace Preferences</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-charcoal-500 mb-1">Default Currency</label><select className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm"><option>INR</option><option>USD</option><option>EUR</option></select></div>
          <div><label className="block text-xs font-medium text-charcoal-500 mb-1">Timezone</label><select className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-sm"><option>Asia/Kolkata</option><option>America/New_York</option><option>Europe/London</option></select></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-sage-200 p-6">
        <h2 className="text-sm font-semibold text-charcoal-800 flex items-center gap-2 mb-4"><Shield className="w-4 h-4" /> Security</h2>
        <button className="text-sm font-medium text-charcoal-600 bg-sage-50 hover:bg-sage-100 px-4 py-2.5 rounded-xl border border-sage-200">Change Password</button>
      </div>
    </div>
  );
}
