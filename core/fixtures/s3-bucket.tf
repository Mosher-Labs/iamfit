resource "aws_s3_bucket" "reports" {
  bucket = "iamfit-example-reports"

  tags = {
    Environment = "dev"
    Team        = "platform"
  }
}
