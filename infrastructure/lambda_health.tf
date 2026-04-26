data "archive_file" "health_lambda" {
  type        = "zip"
  source_file = abspath("${path.module}/../server/dist/health/index.js")
  output_path = abspath("${path.module}/../server/dist/health.zip")
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_health" {
  name               = "${var.project_name}-health-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_health_logs" {
  role       = aws_iam_role.lambda_health.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "health" {
  function_name    = "${var.project_name}-health"
  role               = aws_iam_role.lambda_health.arn
  handler            = "index.handler"
  runtime            = "nodejs22.x"
  filename           = data.archive_file.health_lambda.output_path
  source_code_hash   = data.archive_file.health_lambda.output_base64sha256
  timeout            = 10
  memory_size        = 128

  environment {
    variables = {
      DYNAMODB_TABLE_NAME    = aws_dynamodb_table.main.name
      COGNITO_USER_POOL_ID   = var.cognito_user_pool_id
    }
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_health_logs]
}
