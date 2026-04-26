data "archive_file" "me_lambda" {
  count = local.use_cognito_jwt ? 1 : 0

  type        = "zip"
  source_file = abspath("${path.module}/../server/dist/me/index.js")
  output_path = abspath("${path.module}/../server/dist/me.zip")
}

resource "aws_iam_role" "lambda_me" {
  count              = local.use_cognito_jwt ? 1 : 0
  name               = "${var.project_name}-me-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_me_logs" {
  count      = local.use_cognito_jwt ? 1 : 0
  role       = aws_iam_role.lambda_me[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "me" {
  count            = local.use_cognito_jwt ? 1 : 0
  function_name    = "${var.project_name}-me"
  role             = aws_iam_role.lambda_me[0].arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  filename         = data.archive_file.me_lambda[0].output_path
  source_code_hash = data.archive_file.me_lambda[0].output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      DYNAMODB_TABLE_NAME  = aws_dynamodb_table.main.name
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    }
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_me_logs]
}

resource "aws_apigatewayv2_integration" "me" {
  count                  = local.use_cognito_jwt ? 1 : 0
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.me[0].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "me_get" {
  count              = local.use_cognito_jwt ? 1 : 0
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "GET /me"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito[0].id
  target             = "integrations/${aws_apigatewayv2_integration.me[0].id}"
}

resource "aws_lambda_permission" "me_apigw" {
  count         = local.use_cognito_jwt ? 1 : 0
  statement_id  = "AllowAPIGatewayInvokeMe"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.me[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
