import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getApiBase } from "@/lib/api";

export function HomePage(): ReactElement {
  const [healthText, setHealthText] = useState<string>("Loading…");
  const apiBase = getApiBase();

  const loadHealth = useCallback(() => {
    setHealthText("Loading…");
    const url = apiBase ? `${apiBase}/health` : "/health";
    void fetch(url)
      .then(async (r) => {
        const text = await r.text();
        if (!r.ok) {
          throw new Error(`${String(r.status)} ${text}`);
        }
        try {
          return JSON.stringify(JSON.parse(text) as unknown, null, 2);
        } catch {
          return text;
        }
      })
      .then(setHealthText)
      .catch((err: unknown) => {
        setHealthText(err instanceof Error ? err.message : String(err));
      });
  }, [apiBase]);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-lg space-y-4">
        <nav className="flex gap-3 text-sm">
          <span className="font-medium text-foreground">Home</span>
          <Link className="text-primary underline-offset-4 hover:underline" to="/login">
            Sign in
          </Link>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">newLunchApp</h1>
        <p className="text-sm text-muted-foreground">
          API:{" "}
          <span className="font-mono">
            {apiBase || "(set VITE_API_URL to Terraform api_base_url)"}
          </span>
        </p>
        <Button type="button" variant="secondary" onClick={loadHealth}>
          Retry /health
        </Button>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-xs">
          {healthText}
        </pre>
      </div>
    </div>
  );
}
