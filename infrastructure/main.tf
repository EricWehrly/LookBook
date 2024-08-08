terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.38.0"
    }
  }
}

resource "aws_s3_bucket" "lookbook_bucket" {
  bucket = "lookbook.wehrly.com"
}
