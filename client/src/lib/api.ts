import type { UserProfileDto } from "../../../common/src/profile";

export function getApiBase(): string {
  const v = import.meta.env.VITE_API_URL;
  return typeof v === "string" ? v.replace(/\/$/, "") : "";
}

async function authJson(
  path: string,
  idToken: string,
  init?: RequestInit
): Promise<unknown> {
  const base = getApiBase();
  if (!base) {
    throw new Error("Set VITE_API_URL");
  }
  const r = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`${String(r.status)} ${text}`);
  }
  return JSON.parse(text) as unknown;
}

export async function fetchMe(idToken: string): Promise<string> {
  const data = await authJson("/me", idToken);
  return JSON.stringify(data, null, 2);
}

export async function fetchProfile(
  idToken: string
): Promise<{ profile: UserProfileDto | null }> {
  const data = await authJson("/profile", idToken);
  if (typeof data !== "object" || data === null || !("profile" in data)) {
    throw new Error("Invalid /profile response");
  }
  const profile = (data as { profile: unknown }).profile;
  if (profile !== null && typeof profile !== "object") {
    throw new Error("Invalid profile field");
  }
  return { profile: profile as UserProfileDto | null };
}

export async function putProfile(
  idToken: string,
  body: {
    fullName?: string;
    phone?: string;
    deliveryAddress?: string;
    allergies?: string[];
    note?: string | null;
  }
): Promise<UserProfileDto> {
  const data = await authJson("/profile", idToken, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (typeof data !== "object" || data === null || !("profile" in data)) {
    throw new Error("Invalid /profile PUT response");
  }
  return (data as { profile: UserProfileDto }).profile;
}
