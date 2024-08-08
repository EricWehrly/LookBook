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

data "archive_file" "lambda_upc" {
  type = "zip"

  source_dir  = "${path.module}/../server/"
  output_path = "${path.module}/upc-lambda.zip"
}

resource "aws_s3_object" "lambda_upc" {
  bucket = aws_s3_bucket.lookbook_bucket.id

  key    = "upc-lambda.zip"
  source = data.archive_file.lambda_upc.output_path

  etag = filemd5(data.archive_file.lambda_upc.output_path)
}
