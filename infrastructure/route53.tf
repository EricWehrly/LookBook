resource "aws_route53_zone" "main" {
  name = "wehrly.com"
}

resource "aws_acm_certificate" "wehrly_cert" {
  domain_name       = "*.wehrly.com"
  validation_method = "DNS"
}
/*
resource "aws_route53_record" "api_gateway_dns" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "lookbook.wehrly.com"
  type    = "A"

  alias {
    name                   = aws_api_gateway_domain_name.api_gateway_domain_name.cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.api_gateway_domain_name.cloudfront_zone_id
    evaluate_target_health = true
  }
}
*/

resource "aws_acm_certificate_validation" "wehrly_validation" {
  certificate_arn = aws_acm_certificate.wehrly_cert.arn
  # validation_record_fqdns = [for record in aws_route53_record.gateway_record : record.fqdn]
}

resource "aws_api_gateway_domain_name" "gateway_domain" {
  certificate_arn = aws_acm_certificate_validation.wehrly_validation.certificate_arn
  domain_name     = "lookbook.wehrly.com"
}

resource "aws_api_gateway_base_path_mapping" "lookbook_prod_mapping" {
  api_id      = aws_api_gateway_rest_api.lookbook_api.id
  stage_name  = aws_api_gateway_stage.prod_lookbook.stage_name
  domain_name = aws_api_gateway_domain_name.gateway_domain.domain_name
}

resource "aws_route53_record" "gateway_record" {
  name    = aws_api_gateway_domain_name.gateway_domain.domain_name
  type    = "A"
  zone_id = aws_route53_zone.main.id

  alias {
    evaluate_target_health = true
    name                   = aws_api_gateway_domain_name.gateway_domain.cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.gateway_domain.cloudfront_zone_id
  }
}
