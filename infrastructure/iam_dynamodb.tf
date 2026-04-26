data "aws_iam_policy_document" "lambda_dynamodb_main" {
  statement {
    sid    = "DynamoMainTable"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]
    resources = [
      aws_dynamodb_table.main.arn,
      "${aws_dynamodb_table.main.arn}/index/*",
    ]
  }
}

resource "aws_iam_policy" "lambda_dynamodb_main" {
  name        = "${var.project_name}-lambda-dynamodb-main"
  description = "Single-table access for ${var.dynamodb_table_name}"
  policy      = data.aws_iam_policy_document.lambda_dynamodb_main.json
}

resource "aws_iam_role_policy_attachment" "health_dynamodb" {
  role       = aws_iam_role.lambda_health.name
  policy_arn = aws_iam_policy.lambda_dynamodb_main.arn
}

resource "aws_iam_role_policy_attachment" "me_dynamodb" {
  count = local.use_cognito_jwt ? 1 : 0

  role       = aws_iam_role.lambda_me[0].name
  policy_arn = aws_iam_policy.lambda_dynamodb_main.arn
}
