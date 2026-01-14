terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.28.0"
    }
  }
}

locals {
  common_tags = {
    Project     = "lookbook"
    ManagedBy   = "terraform"
    Environment = "production"
  }
}
