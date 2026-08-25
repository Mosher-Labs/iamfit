variable "region" {
  type    = string
  default = "us-east-1"
}

provider "aws" {
  region = var.region
}

data "aws_ami" "example" {
  most_recent = true
  owners      = ["amazon"]
}

locals {
  environment = "dev"
}

output "bucket_name" {
  value = aws_s3_bucket.reports.bucket
}
