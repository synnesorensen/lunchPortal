import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { UserProfileDto } from "@lunch/common";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { getDocClient } from "../lib/dynamoClient.js";
import { readJwtClaims } from "../lib/jwtClaims.js";
import { getTableName } from "../lib/tableName.js";

const PROFILE_SK = "PROFILE";
const ENTITY = "UserProfile" as const;

function userPk(sub: string): string {
  return `USER#${sub}`;
}

function jsonResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function requireSub(
  event: APIGatewayProxyEventV2
): { sub: string; claims: Record<string, string> } | APIGatewayProxyResultV2 {
  const claims = readJwtClaims(event);
  if (!claims || typeof claims.sub !== "string") {
    return jsonResponse(401, { message: "Missing JWT claims" });
  }
  return { sub: claims.sub, claims };
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function itemToProfileDto(item: Record<string, unknown>): UserProfileDto | null {
  if (item.entityType !== ENTITY) {
    return null;
  }
  const userId = item.userId;
  const fullName = item.fullName;
  const phone = item.phone;
  const deliveryAddress = item.deliveryAddress;
  const allergies = item.allergies;
  const updatedAt = item.updatedAt;
  if (
    typeof userId !== "string" ||
    typeof fullName !== "string" ||
    typeof phone !== "string" ||
    typeof deliveryAddress !== "string" ||
    !isStringArray(allergies) ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }
  const note = item.note;
  return {
    userId,
    fullName,
    phone,
    deliveryAddress,
    allergies,
    ...(typeof note === "string" ? { note } : {}),
    updatedAt,
  };
}

async function getProfileRow(
  sub: string
): Promise<Record<string, unknown> | undefined> {
  const out = await getDocClient().send(
    new GetCommand({
      TableName: getTableName(),
      Key: { pk: userPk(sub), sk: PROFILE_SK },
    })
  );
  const item = out.Item;
  if (typeof item !== "object" || item === null) {
    return undefined;
  }
  return item as Record<string, unknown>;
}

function parseProfileUpdate(
  raw: string | undefined
):
  | { ok: true; patch: ProfilePatch }
  | { ok: false; status: number; message: string } {
  if (raw === undefined || raw.length === 0) {
    return { ok: true, patch: {} };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON body" };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, status: 400, message: "Body must be a JSON object" };
  }
  const o = parsed as Record<string, unknown>;
  const patch: ProfilePatch = {};
  if ("fullName" in o) {
    if (typeof o.fullName !== "string") {
      return { ok: false, status: 400, message: "fullName must be a string" };
    }
    patch.fullName = o.fullName;
  }
  if ("phone" in o) {
    if (typeof o.phone !== "string") {
      return { ok: false, status: 400, message: "phone must be a string" };
    }
    patch.phone = o.phone;
  }
  if ("deliveryAddress" in o) {
    if (typeof o.deliveryAddress !== "string") {
      return {
        ok: false,
        status: 400,
        message: "deliveryAddress must be a string",
      };
    }
    patch.deliveryAddress = o.deliveryAddress;
  }
  if ("allergies" in o) {
    if (!isStringArray(o.allergies)) {
      return { ok: false, status: 400, message: "allergies must be string[]" };
    }
    patch.allergies = o.allergies;
  }
  if ("note" in o) {
    if (o.note === null) {
      patch.note = "";
    } else if (typeof o.note === "string") {
      patch.note = o.note.length > 2000 ? o.note.slice(0, 2000) : o.note;
    } else {
      return { ok: false, status: 400, message: "note must be string or null" };
    }
  }
  return { ok: true, patch };
}

type ProfilePatch = {
  fullName?: string;
  phone?: string;
  deliveryAddress?: string;
  allergies?: string[];
  /** empty string clears note */
  note?: string;
};

function mergeProfile(
  sub: string,
  existing: Record<string, unknown> | undefined,
  patch: ProfilePatch
): UserProfileDto {
  const prev = existing !== undefined ? itemToProfileDto(existing) : null;
  const allergies =
    patch.allergies ??
    prev?.allergies ??
    ([] as readonly string[]);
  const fullName = patch.fullName ?? prev?.fullName ?? "";
  const phone = patch.phone ?? prev?.phone ?? "";
  const deliveryAddress =
    patch.deliveryAddress ?? prev?.deliveryAddress ?? "";
  let note: string | undefined;
  if (patch.note !== undefined) {
    note = patch.note.length === 0 ? undefined : patch.note;
  } else if (prev?.note !== undefined) {
    note = prev.note;
  }
  const updatedAt = new Date().toISOString();
  return {
    userId: sub,
    fullName,
    phone,
    deliveryAddress,
    allergies,
    ...(note !== undefined ? { note } : {}),
    updatedAt,
  };
}

async function handleMe(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const auth = requireSub(event);
  if ("statusCode" in auth) {
    return auth;
  }
  const { sub, claims } = auth;
  const row = await getProfileRow(sub);
  const profile = row !== undefined ? itemToProfileDto(row) : null;
  return jsonResponse(200, {
    sub,
    email: claims.email,
    username: claims["cognito:username"],
    profile,
  });
}

async function handleGetProfile(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const auth = requireSub(event);
  if ("statusCode" in auth) {
    return auth;
  }
  const row = await getProfileRow(auth.sub);
  const profile = row !== undefined ? itemToProfileDto(row) : null;
  return jsonResponse(200, { profile });
}

async function handlePutProfile(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const auth = requireSub(event);
  if ("statusCode" in auth) {
    return auth;
  }
  const parsed = parseProfileUpdate(event.body);
  if (!parsed.ok) {
    return jsonResponse(parsed.status, { message: parsed.message });
  }
  const existing = await getProfileRow(auth.sub);
  const dto = mergeProfile(auth.sub, existing, parsed.patch);
  const record = {
    pk: userPk(auth.sub),
    sk: PROFILE_SK,
    entityType: ENTITY,
    userId: dto.userId,
    fullName: dto.fullName,
    phone: dto.phone,
    deliveryAddress: dto.deliveryAddress,
    allergies: [...dto.allergies],
    updatedAt: dto.updatedAt,
    ...(dto.note !== undefined ? { note: dto.note } : {}),
  };
  await getDocClient().send(
    new PutCommand({
      TableName: getTableName(),
      Item: record,
    })
  );
  return jsonResponse(200, { profile: dto });
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  switch (event.routeKey) {
    case "GET /me":
      return handleMe(event);
    case "GET /profile":
      return handleGetProfile(event);
    case "PUT /profile":
      return handlePutProfile(event);
    default:
      return jsonResponse(404, { message: `Unknown route ${event.routeKey}` });
  }
};
