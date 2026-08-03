from aws_cdk import aws_iam as iam
import json

def create_webapp_admin_boundary(scope, construct_id="WebappAdminPermissionBoundary"):
    boundary_policy_document = iam.PolicyDocument(
        statements=[
            iam.PolicyStatement(
                sid="NoActionsUsedMinimalHeadroom",
                effect=iam.Effect.ALLOW,
                actions=[
                    "aidevops:GetAgentSpace",
                    "aidevops:GetAccountUsage",
                    "aidevops:DescribeServices",
                    "aidevops:DescribeSupportLevel",
                    "aidevops:ListAssets",
                    "aidevops:ListAssetTypes",
                    "aidevops:ListAssetVersions",
                    "aidevops:ListAssetFiles",
                    "aidevops:ListAssociations",
                    "aidevops:ListBacklogTasks",
                    "aidevops:ListChats",
                    "aidevops:ListExecutions",
                    "aidevops:ListGoals",
                    "aidevops:ListJournalRecords",
                    "aidevops:ListKnowledgeItems",
                    "aidevops:ListKnowledgeItemVersions",
                    "aidevops:ListRecommendations",
                    "aidevops:ListTriggers",
                    "aidevops:ListPendingMessages",
                    "aidevops:ListAccessTokens",
                    "aidevops:GetAsset",
                    "aidevops:GetAssetContent",
                    "aidevops:GetAssetFile",
                    "aidevops:GetAssociation",
                    "aidevops:GetBacklogTask",
                    "aidevops:GetKnowledgeItem",
                    "aidevops:GetRecommendation",
                    "aidevops:GetTrigger",
                    "aidevops:GetAccessToken",
                    "aidevops:DiscoverTopology",
                    "support:DescribeCases",
                    "support:DescribeServices",
                    "support:DescribeSupportLevel",
                    "secretsmanager:ListSecrets",
                ],
                resources=["*"],
                conditions={
                    "StringEquals": {
                        "aws:RequestedRegion": ["us-east-1", "us-west-2"]
                    }
                },
            ),
            iam.PolicyStatement(
                sid="DenyHighRiskWriteActions",
                effect=iam.Effect.DENY,
                actions=[
                    "aidevops:CreateAccessToken",
                    "aidevops:RevokeAccessToken",
                    "aidevops:RotateAccessToken",
                    "aidevops:DeleteAsset",
                    "aidevops:DeleteAssetFile",
                    "aidevops:DeleteKnowledgeItem",
                    "aidevops:DeleteTrigger",
                    "aidevops:CreateTrigger",
                    "aidevops:UpdateTrigger",
                    "aidevops:InitiateChatForCase",
                    "aidevops:EndChatForCase",
                    "aidevops:SendMessage",
                    "aidevops:UpdateApprovalAction",
                    "secretsmanager:CreateSecret",
                    "support:InitiateChatForCase",
                    "transcribe:StartStreamTranscriptionWebSocket",
                ],
                resources=["*"],
            ),
        ]
    )

    managed_policy = iam.ManagedPolicy(
        scope,
        construct_id,
        managed_policy_name="DevOpsAgentRole-WebappAdmin-PermissionBoundary",
        description="Least-privilege permission boundary for DevOpsAgentRole-WebappAdmin. Zero CloudTrail usage detected — read-only headroom only.",
        document=boundary_policy_document,
    )

    return managed_policy
