data "archive_file" "db_ping_lambda" {
  type        = "zip"
  source_file = abspath("${path.module}/../server/dist/dbPing/index.js")
  output_path = abspath("${path.module}/../server/dist/dbPing.zip")
}

resource "aws_iam_role" "lambda_db_ping" {
  name               = "${var.project_name}-dbping-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_db_ping_logs" {
  role       = aws_iam_role.lambda_db_ping.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_db_ping_dynamodb" {
  role       = aws_iam_role.lambda_db_ping.name
  policy_arn = aws_iam_policy.lambda_dynamodb_main.arn
}

resource "aws_lambda_function" "db_ping" {
  function_name    = "${var.project_name}-dbping"
  role             = aws_iam_role.lambda_db_ping.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  filename         = data.archive_file.db_ping_lambda.output_path
  source_code_hash = data.archive_file.db_ping_lambda.output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_db_ping_logs,
    aws_iam_role_policy_attachment.lambda_db_ping_dynamodb,
  ]
}

resource "aws_apigatewayv2_integration" "db_ping" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.db_ping.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "db_ping_get" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /db/ping"
  target    = "integrations/${aws_apigatewayv2_integration.db_ping.id}"
}

resource "aws_apigatewayv2_route" "db_ping_post" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /db/ping"
  target    = "integrations/${aws_apigatewayv2_integration.db_ping.id}"
}

resource "aws_lambda_permission" "db_ping_apigw" {
  statement_id  = "AllowAPIGatewayInvokeDbPing"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.db_ping.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
