resource "aws_s3_bucket" "lookbook_bucket" {
  bucket = "lookbook.wehrly.com"

  tags = local.common_tags
}

resource "aws_s3_bucket_website_configuration" "site_config" {
  bucket = aws_s3_bucket.lookbook_bucket.id

  index_document {
    suffix = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "site_access" {
  bucket = aws_s3_bucket.lookbook_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "site_policy" {
  bucket = aws_s3_bucket.lookbook_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.lookbook_bucket.arn}/*"
      }
    ]
  })
}
