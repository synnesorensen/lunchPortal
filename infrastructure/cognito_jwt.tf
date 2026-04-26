resource "aws_apigatewayv2_authorizer" "cognito" {
  count = local.use_cognito_jwt ? 1 : 0

  api_id           = aws_apigatewayv2_api.http.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project_name}-cognito-jwt"

  jwt_configuration {
    audience = [var.cognito_app_client_id]
    issuer   = local.cognito_jwt_issuer
  }
}
