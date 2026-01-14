output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_domain_name.gateway_domain.domain_name}"
}

output "api_gateway_stage_invoke_url" {
  description = "Direct invoke URL of the API Gateway stage"
  value       = aws_api_gateway_stage.prod_lookbook.invoke_url
}
