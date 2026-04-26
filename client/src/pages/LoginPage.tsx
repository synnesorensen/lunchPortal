import { useState, type FormEvent, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchMe, fetchProfile, putProfile } from "@/lib/api";
import { getStoredSession, signInWithPassword, signOut } from "@/auth/cognito";

function cognitoConfigured(): boolean {
  const pool = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const client = import.meta.env.VITE_COGNITO_CLIENT_ID;
  return (
    typeof pool === "string" &&
    pool.length > 0 &&
    typeof client === "string" &&
    client.length > 0
  );
}

function allergiesToString(allergies: readonly string[]): string {
  return allergies.join(", ");
}

function parseAllergies(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function LoginPage(): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [meText, setMeText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [allergiesStr, setAllergiesStr] = useState("");
  const [note, setNote] = useState("");
  const [profileMsg, setProfileMsg] = useState<string>("");

  const withToken = (
    fn: (token: string) => Promise<void>,
    errPrefix: string
  ): void => {
    setError("");
    setProfileMsg("");
    if (!cognitoConfigured()) {
      setError("Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID");
      return;
    }
    setLoading(true);
    void getStoredSession()
      .then((s) => fn(s.getIdToken().getJwtToken()))
      .catch((err: unknown) => {
        setError(
          `${errPrefix}: ${err instanceof Error ? err.message : String(err)}`
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMeText("");
    setProfileMsg("");
    if (!cognitoConfigured()) {
      setError("Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID");
      return;
    }
    setLoading(true);
    void signInWithPassword(email, password)
      .then((session) => {
        const token = session.getIdToken().getJwtToken();
        return fetchMe(token).then((text) => {
          setMeText(text);
          return token;
        });
      })
      .then((token) => fetchProfile(token))
      .then(({ profile }) => {
        if (profile !== null) {
          setFullName(profile.fullName);
          setPhone(profile.phone);
          setDeliveryAddress(profile.deliveryAddress);
          setAllergiesStr(allergiesToString(profile.allergies));
          setNote(profile.note ?? "");
          setProfileMsg("Loaded profile from Dynamo.");
        } else {
          setProfileMsg("No profile row yet — fill fields and save.");
        }
      })
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
    setProfileMsg("");
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

  const loadProfile = () => {
    withToken(async (token) => {
      const { profile } = await fetchProfile(token);
      if (profile !== null) {
        setFullName(profile.fullName);
        setPhone(profile.phone);
        setDeliveryAddress(profile.deliveryAddress);
        setAllergiesStr(allergiesToString(profile.allergies));
        setNote(profile.note ?? "");
        setProfileMsg("Loaded profile.");
      } else {
        setProfileMsg("No profile yet (null).");
      }
    }, "Load profile");
  };

  const saveProfile = () => {
    withToken(async (token) => {
      const dto = await putProfile(token, {
        fullName,
        phone,
        deliveryAddress,
        allergies: parseAllergies(allergiesStr),
        ...(note.length > 0 ? { note } : { note: null }),
      });
      setFullName(dto.fullName);
      setPhone(dto.phone);
      setDeliveryAddress(dto.deliveryAddress);
      setAllergiesStr(allergiesToString(dto.allergies));
      setNote(dto.note ?? "");
      setProfileMsg("Saved profile.");
    }, "Save profile");
  };

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-md space-y-8">
        <nav className="flex gap-3 text-sm">
          <Link className="text-primary underline-offset-4 hover:underline" to="/">
            Home
          </Link>
          <span className="font-medium">Sign in</span>
        </nav>
        <h1 className="text-xl font-semibold">Sign in (Cognito)</h1>
        <p className="text-sm text-muted-foreground">
          Uses USER_SRP_AUTH via app client (no client secret). Calls{" "}
          <code className="rounded bg-muted px-1">GET /me</code> and can load/save{" "}
          <code className="rounded bg-muted px-1">GET/PUT /profile</code> (Dynamo{" "}
          <code className="rounded bg-muted px-1">USER#sub / PROFILE</code>).
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
              {loading ? "…" : "Sign in & load profile"}
            </Button>
            <Button type="button" variant="outline" disabled={loading} onClick={trySession}>
              Use saved session → /me
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                signOut();
                setMeText("");
                setProfileMsg("");
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

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-medium">Profile (Dynamo)</h2>
          <p className="text-xs text-muted-foreground">
            Requires an existing Cognito session. Allergies: comma-separated.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="fn">
              Full name
            </label>
            <input
              id="fn"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={fullName}
              onChange={(ev) => {
                setFullName(ev.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="ph">
              Phone
            </label>
            <input
              id="ph"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={phone}
              onChange={(ev) => {
                setPhone(ev.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="addr">
              Delivery address
            </label>
            <input
              id="addr"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={deliveryAddress}
              onChange={(ev) => {
                setDeliveryAddress(ev.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="all">
              Allergies
            </label>
            <input
              id="all"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={allergiesStr}
              onChange={(ev) => {
                setAllergiesStr(ev.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="note">
              Note
            </label>
            <input
              id="note"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={note}
              onChange={(ev) => {
                setNote(ev.target.value);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={loading} onClick={loadProfile}>
              GET /profile
            </Button>
            <Button type="button" disabled={loading} onClick={saveProfile}>
              PUT /profile
            </Button>
          </div>
          {profileMsg ? (
            <p className="text-sm text-muted-foreground" role="status">
              {profileMsg}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
