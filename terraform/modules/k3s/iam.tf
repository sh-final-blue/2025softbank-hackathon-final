# ===========================================
# K3s IAM Roles and Policies
# ===========================================

# Trust Policy for EC2
data "aws_iam_policy_document" "ec2_trust" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# ===========================================
# Control Plane IAM
# ===========================================

resource "aws_iam_role" "k3s_control_plane" {
  name               = "${var.name_prefix}-k3s-control-plane"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json

  tags = var.tags
}

resource "aws_iam_role_policy" "k3s_control_plane" {
  name = "${var.name_prefix}-k3s-control-plane-policy"
  role = aws_iam_role.k3s_control_plane.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeTags",
          "ec2:DescribeInstances",
          "ec2:DescribeRegions",
          "ec2:DescribeRouteTables",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVolumes",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeVpcs",
          "ec2:DescribeNetworkInterfaces",
          "ec2:CreateSecurityGroup",
          "ec2:CreateTags",
          "ec2:CreateVolume",
          "ec2:CreateNetworkInterface",
          "ec2:ModifyInstanceAttribute",
          "ec2:ModifyVolume",
          "ec2:ModifyNetworkInterfaceAttribute",
          "ec2:AttachVolume",
          "ec2:AttachNetworkInterface",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:CreateRoute",
          "ec2:DeleteRoute",
          "ec2:DeleteSecurityGroup",
          "ec2:DeleteVolume",
          "ec2:DeleteNetworkInterface",
          "ec2:DetachVolume",
          "ec2:DetachNetworkInterface",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses",
          "elasticloadbalancing:*",
          "iam:CreateServiceLinkedRole",
          "kms:DescribeKey"
        ]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          # ECR Pull
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:BatchGetImage",
          # ECR Push
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "k3s_control_plane" {
  name = "${var.name_prefix}-k3s-control-plane"
  role = aws_iam_role.k3s_control_plane.name
}

# ===========================================
# Worker Node IAM
# ===========================================

resource "aws_iam_role" "k3s_worker" {
  name               = "${var.name_prefix}-k3s-worker"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json

  tags = var.tags
}

resource "aws_iam_role_policy" "k3s_worker" {
  name = "${var.name_prefix}-k3s-worker-policy"
  role = aws_iam_role.k3s_worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # EC2 Network Interface (for VPC CNI)
          "ec2:AssignPrivateIpAddresses",
          "ec2:AttachNetworkInterface",
          "ec2:CreateNetworkInterface",
          "ec2:CreateTags",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
          "ec2:DescribeRegions",
          "ec2:DetachNetworkInterface",
          "ec2:ModifyNetworkInterfaceAttribute",
          "ec2:UnassignPrivateIpAddresses",
          # ECR Pull
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:BatchGetImage",
          # ECR Push
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "k3s_worker" {
  name = "${var.name_prefix}-k3s-worker"
  role = aws_iam_role.k3s_worker.name
}
