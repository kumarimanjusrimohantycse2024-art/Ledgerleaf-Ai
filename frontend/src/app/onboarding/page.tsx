"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, ArrowRight, Building2, Globe, Clock } from "lucide-react";
import { api, getToken, setOrgId } from "@/lib/api";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"];
const TIMEZONES = ["Asia/Kolkata", "America/New_York", "Europe/London", "Asia/Singapore", "America/Los_Angeles", "Australia/Sydney"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", country: "IN", currency: "INR", timezone: "Asia/Kolkata" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Business name is required"); return; }
    setError(""); setLoading(true);
    try {
      const token = getToken();
      const org: any = await api("/api/v1/auth/organizations", {
        method: "POST", token: token || undefined,
        body: JSON.stringify(form),
      });
      setOrgId(org.id);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 via-cream-50 to-sage-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-forest-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-8 h-8 text-forest-600" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">You&apos;re all set!</h1>
          <p className="text-charcoal-500 mb-8">Your workspace <strong>{form.name}</strong> is ready. Let&apos;s explore your dashboard.</p>
          <button onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 bg-forest-600 hover:bg-forest-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-sm">
            Go to Dashboard <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 via-cream-50 to-sage-50 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-forest-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900">Set up your workspace</h1>
          <p className="text-charcoal-400 mt-1">Tell us about your business</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-charcoal-900/5 border border-sage-200 p-8">
          {error && <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
                <Building2 className="w-4 h-4 inline mr-1" /> Business Name
              </label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-charcoal-800 placeholder:text-charcoal-300 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm"
                placeholder="e.g. Pixel Studio" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
                  <Globe className="w-4 h-4 inline mr-1" /> Currency
                </label>
                <select value={form.currency} onChange={(e) => update("currency", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-charcoal-800 text-sm">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
                  <Clock className="w-4 h-4 inline mr-1" /> Timezone
                </label>
                <select value={form.timezone} onChange={(e) => update("timezone", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-charcoal-800 text-sm">
                  {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleCreate} disabled={loading}
              className="w-full bg-forest-600 hover:bg-forest-700 disabled:bg-forest-400 text-white font-semibold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm mt-4">
              {loading ? "Creating…" : "Create Workspace"} {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
