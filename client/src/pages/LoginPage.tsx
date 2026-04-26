import { useState, type FormEvent, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchMe } from "@/lib/api";
import { getStoredSession, signInWithPassword, signOut } from "@/auth/cognito";

function cognitoConfigured(): boolean {
  try {
    const pool = import.meta.env.VITE_COGNITO_USER_POOL_ID;
    const client = import.meta.env.VITE_COGNITO_CLIENT_ID;
    return (
      typeof pool === "string" &&
      pool.length > 0 &&
      typeof client === "string" &&
      client.length > 0
    );
  } catch {
    return false;
  }
}

export function LoginPage(): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [meText, setMeText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMeText("");
    if (!cognitoConfigured()) {
      setError("Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID");
      return;
    }
    setLoading(true);
    void signInWithPassword(email, password)
      .then((session) => {
        const token = session.getIdToken().getJwtToken();
        return fetchMe(token);
      })
      .then(setMeText)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const trySession = () => {
    setError("");
    setMeText("");
    if (!cognitoConfigured()) {
      setError("Set Cognito env vars");
      return;
    }
    setLoading(true);
    void getStoredSession()
      .then((session) => fetchMe(session.getIdToken().getJwtToken()))
      .then(setMeText)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-md space-y-6">
        <nav className="flex gap-3 text-sm">
          <Link className="text-primary underline-offset-4 hover:underline" to="/">
            Home
          </Link>
          <span className="font-medium">Sign in</span>
        </nav>
        <h1 className="text-xl font-semibold">Sign in (Cognito)</h1>
        <p className="text-sm text-muted-foreground">
          Uses USER_SRP_AUTH via app client (no client secret). After login, calls{" "}
          <code className="rounded bg-muted px-1">GET /me</code> with the Id token.
        </p>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={password}
              onChange={(ev) => {
                setPassword(ev.target.value);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "…" : "Sign in & call /me"}
            </Button>
            <Button type="button" variant="outline" disabled={loading} onClick={trySession}>
              Use saved session
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                signOut();
                setMeText("");
                setError("Signed out");
              }}
            >
              Sign out
            </Button>
          </div>
        </form>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {meText ? (
          <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-xs">
            {meText}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
