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

resource "aws_lambda_function" "upc_lookup" {
  function_name = "UPCLookup"

  s3_bucket = aws_s3_bucket.lookbook_bucket.id
  s3_key    = aws_s3_object.lambda_upc.key

  runtime = "nodejs20.x"
  handler = "lambda.handler"

  source_code_hash = data.archive_file.lambda_upc.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
}

/* hopefully we don't need cloudwatch
resource "aws_cloudwatch_log_group" "hello_world" {
  name = "/aws/lambda/${aws_lambda_function.hello_world.function_name}"

  retention_in_days = 30
}
*/

resource "aws_iam_role" "lambda_exec" {
  name = "serverless_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

