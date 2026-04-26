import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

function readJwtClaims(
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

/** Returns a small subset of Cognito JWT claims (API Gateway has already validated the token). */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const claims = readJwtClaims(event);
  if (!claims || typeof claims.sub !== "string") {
    return {
      statusCode: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ message: "Missing JWT claims" }),
    };
  }

  const body = {
    sub: claims.sub,
    email: claims.email,
    username: claims["cognito:username"],
  };

  return {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
};
