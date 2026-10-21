"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, ArrowRight, Eye, EyeOff } from "lucide-react";
import { api, setToken, setOrgId } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data: any = await api("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.access_token);

      // Fetch orgs and set default
      const orgs: any[] = await api("/api/v1/auth/organizations", {
        token: data.access_token,
      });
      if (orgs.length > 0) {
        setOrgId(orgs[0].id);
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 via-cream-50 to-sage-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-forest-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-forest-800">LedgerLeaf AI</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-charcoal-900/5 border border-sage-200 p-8">
          <h1 className="text-2xl font-bold text-charcoal-900 mb-1">Welcome back</h1>
          <p className="text-sm text-charcoal-400 mb-8">Sign in to your account</p>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-charcoal-700 mb-1.5">Email</label>
              <input
                id="login-email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-charcoal-800 placeholder:text-charcoal-300 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm"
                placeholder="you@agency.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-charcoal-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="login-password" type={showPw ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-sage-300 bg-cream-50 text-charcoal-800 placeholder:text-charcoal-300 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-forest-600 hover:bg-forest-700 disabled:bg-forest-400 text-white font-semibold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm"
            >
              {loading ? "Signing in…" : "Sign In"} {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-charcoal-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-forest-600 font-semibold hover:text-forest-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
