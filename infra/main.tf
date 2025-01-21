terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"  # Change to your preferred region
}

resource "aws_amplify_app" "autocrm" {
  name         = "AutoCRM"
  repository   = "https://github.com/daig/AutoCRM"
  platform     = "WEB"

  # IAM service role ARN if needed
  # iam_service_role_arn = "arn:aws:iam::123456789012:role/AmplifyRole"

  build_spec = file("${path.module}/amplify.yml")

  # Enable branch auto-build and deployment
  enable_branch_auto_build = true

  environment_variables = {
    VITE_SUPABASE_URL      = var.supabase_url
    VITE_SUPABASE_ANON_KEY = var.supabase_anon_key
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.autocrm.id
  branch_name = "main"
  framework   = "React"
  stage       = "PRODUCTION"
}

# Variables
variable "supabase_url" {
  type        = string
  description = "Supabase URL"
  sensitive   = true
}

variable "supabase_anon_key" {
  type        = string
  description = "Supabase Anonymous Key"
  sensitive   = true
} 