output "api_base_url" {
  description = "Base URL for the HTTP API (no trailing slash)."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.main.name
}

output "health_lambda_name" {
  value = aws_lambda_function.health.function_name
}
