import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { getTableName } from "../lib/tableName.js";

const PING_PK = "SYSTEM";
const PING_SK = "PING";

function getAwsRegion(): string {
  const r = process.env.AWS_REGION;
  if (typeof r !== "string" || r.length === 0) {
    throw new Error("Missing env AWS_REGION");
  }
  return r;
}

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: getAwsRegion(),
  })
);

interface PingItem {
  pk: string;
  sk: string;
  updatedAt: string;
  note?: string;
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

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const tableName = getTableName();

  if (method === "GET") {
    const out = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { pk: PING_PK, sk: PING_SK },
      })
    );
    const item = out.Item as PingItem | undefined;
    return jsonResponse(200, {
      ok: true,
      action: "read",
      item: item ?? null,
    });
  }

  if (method === "POST") {
    let note: string | undefined;
    if (event.body !== undefined && event.body.length > 0) {
      try {
        const parsed: unknown = JSON.parse(event.body);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "note" in parsed &&
          typeof (parsed as { note: unknown }).note === "string"
        ) {
          const n = (parsed as { note: string }).note;
          note = n.length > 500 ? n.slice(0, 500) : n;
        }
      } catch {
        return jsonResponse(400, { ok: false, message: "Invalid JSON body" });
      }
    }

    const item: PingItem = {
      pk: PING_PK,
      sk: PING_SK,
      updatedAt: new Date().toISOString(),
      ...(note !== undefined ? { note } : {}),
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return jsonResponse(200, {
      ok: true,
      action: "write",
      item,
    });
  }

  return jsonResponse(405, {
    ok: false,
    message: `Method ${method} not allowed; use GET or POST`,
  });
};
