variable "aws_region" {
  default = "us-east-1"
}

resource "aws_api_gateway_rest_api" "lookbook_api" {
  name = "lookbook_api"
}

resource "aws_api_gateway_deployment" "S3APIDeployment" {
  depends_on  = [aws_api_gateway_integration.S3Integration]
  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  stage_name  = "lookbook_prod"
}

resource "aws_api_gateway_resource" "api_resource_upc" {
  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  parent_id   = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  path_part   = "upc"
}

resource "aws_api_gateway_method" "api_method_upc" {
  rest_api_id   = aws_api_gateway_rest_api.lookbook_api.id
  resource_id   = aws_api_gateway_resource.api_resource_upc.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "upc_lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.lookbook_api.id
  resource_id             = aws_api_gateway_resource.api_resource_upc.id
  http_method             = aws_api_gateway_method.api_method_upc.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.upc_lookup.invoke_arn
}

/*
resource "aws_api_gateway_resource" "Folder" {
  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  parent_id   = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  path_part   = "{folder}"
}
*/

resource "aws_api_gateway_resource" "s3_item" {
  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  parent_id   = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  path_part   = "{proxy+}"
}

/* we probably don't want this 
resource "aws_api_gateway_method" "GetBuckets" {
  rest_api_id   = aws_api_gateway_rest_api.lookbook_api.id
  resource_id   = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  http_method   = "GET"
  authorization = "AWS_IAM"
}

resource "aws_api_gateway_integration" "get_buckets_integration" {
  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  resource_id = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  http_method = aws_api_gateway_method.GetBuckets.http_method

  # Included because of this issue: https://github.com/hashicorp/terraform/issues/10501
  integration_http_method = "GET"

  type = "AWS"

  # See uri description: https://docs.aws.amazon.com/apigateway/api-reference/resource/integration/
  uri         = "arn:aws:apigateway:${var.aws_region}:s3:path//"
  credentials = aws_iam_role.s3_api_gateway_role.arn
}
*/

resource "aws_api_gateway_method" "GetItem" {
  rest_api_id   = aws_api_gateway_rest_api.lookbook_api.id
  resource_id   = aws_api_gateway_resource.s3_item.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

resource "aws_api_gateway_integration" "S3Integration" {
  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  resource_id   = aws_api_gateway_resource.s3_item.id
  http_method = aws_api_gateway_method.GetItem.http_method

  # Included because of this issue: https://github.com/hashicorp/terraform/issues/10501
  integration_http_method = "GET"

  type = "HTTP_PROXY"
  passthrough_behavior    = "WHEN_NO_MATCH"

  # See uri description: https://docs.aws.amazon.com/apigateway/api-reference/resource/integration/
  uri = "http://lookbook.wehrly.com.s3-website-us-east-1.amazonaws.com/{proxy}"
  credentials = aws_iam_role.s3_api_gateway_role.arn

  request_parameters = {
    "integration.request.path.proxy" = "method.request.path.proxy"
  }
}

# Create S3 Full Access Policy
resource "aws_iam_policy" "s3_policy" {
  name        = "s3-policy"
  description = "Policy for allowing all S3 Actions"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "*"
        }
    ]
}
EOF
}

# Create API Gateway Role
resource "aws_iam_role" "s3_api_gateway_role" {
  name = "s3-api-gateway-role"

  # Create Trust Policy for API Gateway
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

# Attach S3 Access Policy to the API Gateway Role
resource "aws_iam_role_policy_attachment" "s3_policy_attach" {
  role       = aws_iam_role.s3_api_gateway_role.name
  policy_arn = aws_iam_policy.s3_policy.arn
}

/*
resource "aws_api_gateway_method_response" "Status200" {
  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  resource_id = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  http_method = aws_api_gateway_method.GetItem.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Timestamp"      = true
    "method.response.header.Content-Length" = true
    "method.response.header.Content-Type"   = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_method_response" "Status400" {
  # depends_on = [aws_api_gateway_integration.S3Integration]

  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  resource_id = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  http_method = aws_api_gateway_method.GetItem.http_method
  status_code = "400"
}

resource "aws_api_gateway_method_response" "Status500" {
  # depends_on = [aws_api_gateway_integration.S3Integration]

  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  resource_id = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  http_method = aws_api_gateway_method.GetItem.http_method
  status_code = "500"
}

resource "aws_api_gateway_integration_response" "IntegrationResponse200" {
  # depends_on = [aws_api_gateway_integration.S3Integration]

  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  resource_id = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  http_method = aws_api_gateway_method.GetItem.http_method
  status_code = aws_api_gateway_method_response.Status200.status_code

  response_parameters = {
    "method.response.header.Timestamp"      = "integration.response.header.Date"
    "method.response.header.Content-Length" = "integration.response.header.Content-Length"
    "method.response.header.Content-Type"   = "integration.response.header.Content-Type"
  }
}

resource "aws_api_gateway_integration_response" "IntegrationResponse400" {
  # depends_on = [aws_api_gateway_integration.S3Integration]

  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  resource_id = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  http_method = aws_api_gateway_method.GetItem.http_method
  status_code = aws_api_gateway_method_response.Status400.status_code

  selection_pattern = "4\\d{2}"
}

resource "aws_api_gateway_integration_response" "IntegrationResponse500" {
  # depends_on = [aws_api_gateway_integration.S3Integration]

  rest_api_id = aws_api_gateway_rest_api.lookbook_api.id
  resource_id = aws_api_gateway_rest_api.lookbook_api.root_resource_id
  http_method = aws_api_gateway_method.GetItem.http_method
  status_code = aws_api_gateway_method_response.Status500.status_code

  selection_pattern = "5\\d{2}"
}
*/

resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_api_gateway_rest_api.lookbook_api.name}"

  retention_in_days = 30
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upc_lookup.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.lookbook_api.execution_arn}/*/*"
}
