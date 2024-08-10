resource "aws_api_gateway_rest_api" "lookbook_api" {
  name = "lookbook_api"
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

resource "aws_api_gateway_integration" "integration" {
  rest_api_id             = aws_api_gateway_rest_api.lookbook_api.id
  resource_id             = aws_api_gateway_resource.api_resource_upc.id
  http_method             = aws_api_gateway_method.api_method_upc.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.upc_lookup.invoke_arn
}

/*
resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_api_gateway_rest_api.lambda.name}"

  retention_in_days = 30
}
*/

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upc_lookup.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.lookbook_api.execution_arn}/*/*"
}
