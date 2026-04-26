import type { APIGatewayProxyEventV2 } from "aws-lambda";

export function readJwtClaims(
  event: APIGatewayProxyEventV2
): Record<string, string> | undefined {
  const rc: unknown = event.requestContext;
  if (typeof rc !== "object" || rc === null) {
    return undefined;
  }
  const authorizer = Reflect.get(rc, "authorizer");
  if (typeof authorizer !== "object" || authorizer === null) {
    return undefined;
  }
  const jwt = Reflect.get(authorizer, "jwt");
  if (typeof jwt !== "object" || jwt === null) {
    return undefined;
  }
  const claims = Reflect.get(jwt, "claims");
  if (typeof claims !== "object" || claims === null) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(claims)) {
    if (typeof v === "string") {
      out[k] = v;
    }
  }
  return out;
}
