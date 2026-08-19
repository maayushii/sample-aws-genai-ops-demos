"""CDK stack for the Aurora MySQL Cost Optimization Assistant.

Deploys:
- S3 bucket for generated reports
- An analyzer Lambda (Bedrock Nova) with read-only RDS/CloudWatch access
"""
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_iam as iam,
    aws_lambda as lambda_,
    RemovalPolicy,
    CfnOutput,
    Duration,
)
from constructs import Construct


class AuroraCostStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        results_bucket = s3.Bucket(
            self,
            "AuroraCostResultsBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
        )

        analyzer_role = iam.Role(
            self,
            "AnalyzerRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )
        results_bucket.grant_read_write(analyzer_role)

        # Read-only discovery + metrics + pricing
        analyzer_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances",
                    "rds:DescribeDBClusterSnapshots",
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:GetMetricData",
                    "pricing:GetProducts",
                ],
                resources=["*"],
            )
        )
        # Bedrock model invocation (Converse uses bedrock:InvokeModel)
        analyzer_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["bedrock:InvokeModel"],
                resources=[f"arn:aws:bedrock:{cdk.Aws.REGION}::foundation-model/*"],
            )
        )

        analyzer = lambda_.Function(
            self,
            "AuroraCostAnalyzer",
            function_name="aurora-cost-analyzer",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="app.handler",
            code=lambda_.Code.from_asset("../../src/analyzer", exclude=["__pycache__", "*.pyc"]),
            timeout=Duration.minutes(5),
            memory_size=512,
            role=analyzer_role,
            environment={"RESULTS_BUCKET": results_bucket.bucket_name},
        )

        CfnOutput(
            self,
            "ResultsBucketName",
            value=results_bucket.bucket_name,
            description="S3 bucket holding generated cost reports",
        )
        CfnOutput(
            self,
            "AnalyzerFunctionName",
            value=analyzer.function_name,
            description="Aurora cost analyzer Lambda function name",
        )
