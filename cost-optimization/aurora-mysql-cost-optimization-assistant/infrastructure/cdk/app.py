#!/usr/bin/env python3
"""CDK App for the Aurora MySQL Cost Optimization Assistant."""
import aws_cdk as cdk
from stack import AuroraCostStack
from shared.utils import get_region

app = cdk.App()

region = get_region()

AuroraCostStack(
    app,
    f"AuroraCostStack-{region}",
    env={"region": region},
    description="Aurora MySQL cost optimization assistant — AI-generated right-sizing and savings recommendations (uksb-do9bhieqqh)(tag:aurora-cost-optimization,cost-optimization)",
)

app.synth()
