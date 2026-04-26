locals {
  cognito_jwt_issuer = var.cognito_user_pool_id != "" ? "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}" : ""
  use_cognito_jwt    = var.cognito_user_pool_id != "" && var.cognito_app_client_id != ""
}
