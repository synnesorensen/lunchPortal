import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

function getAwsRegion(): string {
  const r = process.env.AWS_REGION;
  if (typeof r !== "string" || r.length === 0) {
    throw new Error("Missing env AWS_REGION");
  }
  return r;
}

let cached: DynamoDBDocumentClient | undefined;

export function getDocClient(): DynamoDBDocumentClient {
  if (cached === undefined) {
    cached = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: getAwsRegion() })
    );
  }
  return cached;
}
