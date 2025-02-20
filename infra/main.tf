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
  access_token = var.github_access_token

  # IAM service role ARN if needed
  # iam_service_role_arn = "arn:aws:iam::123456789012:role/AmplifyRole"

  build_spec = file("${path.module}/../amplify.yml")

  # Enable branch auto-build and deployment
  enable_branch_auto_build = true

  # Rewrite all non-asset requests to index.html for client-side routing
    custom_rule {
    source = "/assets/<*>"
    target = "/assets/<*>"
    status = "200"
  }
//
 

  custom_rule {
    source = "/<*>"
    target = "/index.html"
    status = "200"
  }

  # Enable GitHub integration
  enable_auto_branch_creation = true
  enable_branch_auto_deletion = true
  auto_branch_creation_patterns = [
    "main",
    "dev",
    "feature/*"
  ]

  # Add GitHub webhook to trigger builds


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

  enable_auto_build = true
}

resource "aws_amplify_branch" "dev" {
  app_id      = aws_amplify_app.autocrm.id
  branch_name = "dev"
  framework   = "React"
  stage       = "DEVELOPMENT"

  enable_auto_build = true
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

variable "github_access_token" {
  type        = string
  description = "GitHub personal access token"
  sensitive   = true
}

# Update outputs section
output "amplify_app_url" {
  value = {
    main = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.autocrm.default_domain}"
    dev  = "https://${aws_amplify_branch.dev.branch_name}.${aws_amplify_app.autocrm.default_domain}"
  }
}

# Add these outputs
output "amplify_app_id" {
  value = aws_amplify_app.autocrm.id
}

output "amplify_branch_name" {
  value = {
    main = aws_amplify_branch.main.branch_name
    dev  = aws_amplify_branch.dev.branch_name
  }
}