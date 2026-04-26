import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

type CognitoEnvKey = "VITE_COGNITO_USER_POOL_ID" | "VITE_COGNITO_CLIENT_ID";

function requireEnv(name: CognitoEnvKey): string {
  const v = import.meta.env[name];
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`Missing env ${name}`);
  }
  return v;
}

export function getUserPool(): CognitoUserPool {
  return new CognitoUserPool({
    UserPoolId: requireEnv("VITE_COGNITO_USER_POOL_ID"),
    ClientId: requireEnv("VITE_COGNITO_CLIENT_ID"),
  });
}

export function signInWithPassword(
  email: string,
  password: string
): Promise<CognitoUserSession> {
  const pool = getUserPool();
  const authDetails = new AuthenticationDetails({
    Username: email.trim(),
    Password: password,
  });
  const user = new CognitoUser({
    Username: email.trim(),
    Pool: pool,
  });
  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: resolve,
      onFailure: (err) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    });
  });
}

export function getStoredSession(): Promise<CognitoUserSession> {
  const pool = getUserPool();
  const user = pool.getCurrentUser();
  if (!user) {
    return Promise.reject(new Error("Not signed in"));
  }
  return new Promise((resolve, reject) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err !== null && err !== undefined) {
        reject(err);
        return;
      }
      if (!session || !session.isValid()) {
        reject(new Error("Session invalid"));
        return;
      }
      resolve(session);
    });
  });
}

export function signOut(): void {
  const pool = getUserPool();
  const user = pool.getCurrentUser();
  if (user) {
    user.signOut();
  }
}
