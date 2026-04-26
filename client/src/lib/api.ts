export function getApiBase(): string {
  const v = import.meta.env.VITE_API_URL;
  return typeof v === "string" ? v.replace(/\/$/, "") : "";
}

export async function fetchMe(idToken: string): Promise<string> {
  const base = getApiBase();
  if (!base) {
    throw new Error("Set VITE_API_URL");
  }
  const r = await fetch(`${base}/me`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`${String(r.status)} ${text}`);
  }
  try {
    return JSON.stringify(JSON.parse(text) as unknown, null, 2);
  } catch {
    return text;
  }
}
