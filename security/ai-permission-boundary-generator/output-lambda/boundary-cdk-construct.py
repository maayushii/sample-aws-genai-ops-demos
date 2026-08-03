from aws_cdk import aws_iam as iam
from constructs import Construct

class APILambdaPermissionBoundary(Construct):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        self.boundary_policy = iam.ManagedPolicy(
            self,
            "APILambdaPermissionBoundary",
            managed_policy_name="AnyCompanyITPortal-APILambda-PermissionBoundary",
            description="Least-privilege permission boundary for AnyCompanyITPortalStack APILambdaServiceRole",
            document=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        sid="CloudWatchLogsHeadroom",
                        effect=iam.Effect.ALLOW,
                        actions=[
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams",
                        ],
                        resources=["*"],
                    ),
                    iam.PolicyStatement(
                        sid="DynamoDBHeadroom",
                        effect=iam.Effect.ALLOW,
                        actions=[
                            "dynamodb:DescribeTable",
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:ConditionCheckItem",
                            "dynamodb:GetRecords",
                            "dynamodb:GetShardIterator",
                            "dynamodb:DescribeTimeToLive",
                            "dynamodb:ListTagsOfResource",
                        ],
                        resources=["*"],
                    ),
                ]
            ),
        )
