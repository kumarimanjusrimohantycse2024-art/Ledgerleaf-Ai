/* LedgerLeaf AI — API Client */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
  orgId?: string;
}

export async function api<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, orgId, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (orgId) headers["X-Org-Id"] = orgId;

  const res = await fetch(`${API_URL}${path}`, { headers, ...rest });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/* Auth helpers */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ll_token");
}

export function setToken(token: string): void {
  localStorage.setItem("ll_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("ll_token");
}

export function getOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ll_org_id");
}

export function setOrgId(id: string): void {
  localStorage.setItem("ll_org_id", id);
}

/* Authenticated API call */
export async function authApi<T = unknown>(
  path: string,
  options: Omit<FetchOptions, "token" | "orgId"> = {}
): Promise<T> {
  return api<T>(path, {
    ...options,
    token: getToken() || undefined,
    orgId: getOrgId() || undefined,
  });
}

/* Format currency */
export function formatCurrency(
  amount: number | string,
  currency = "INR"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

/* Format date */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/* Status badge color */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-charcoal-100 text-charcoal-600",
    issued: "bg-info/10 text-info",
    partially_paid: "bg-warning/10 text-warning",
    paid: "bg-forest-100 text-forest-700",
    overdue: "bg-error/10 text-error",
    cancelled: "bg-charcoal-100 text-charcoal-500",
    pending_review: "bg-warning/10 text-warning",
    approved: "bg-forest-100 text-forest-700",
    rejected: "bg-error/10 text-error",
    pending_approval: "bg-warning/10 text-warning",
    completed: "bg-forest-100 text-forest-700",
    failed: "bg-error/10 text-error",
    expired: "bg-charcoal-100 text-charcoal-500",
  };
  return colors[status] || "bg-charcoal-100 text-charcoal-600";
}
