/** Table name from Lambda environment (set by Terraform). */
export function getTableName(): string {
  const t = process.env.DYNAMODB_TABLE_NAME;
  if (typeof t !== "string" || t.length === 0) {
    throw new Error("Missing env DYNAMODB_TABLE_NAME");
  }
  return t;
}
