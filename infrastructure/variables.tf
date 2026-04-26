variable "aws_region" {
  type        = string
  description = "AWS region for all resources."
  default     = "eu-north-1"
}

variable "project_name" {
  type        = string
  description = "Short name prefix for resources."
  default     = "newlunchapp"
}

variable "dynamodb_table_name" {
  type        = string
  description = "Physical name of the single-table DynamoDB store."
  default     = "newlunchapp-data"
}

variable "cognito_user_pool_id" {
  type        = string
  description = "Existing Cognito user pool id (same pool after cutover). Not used by health Lambda yet."
  default     = ""
}
