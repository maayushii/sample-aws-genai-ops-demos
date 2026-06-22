import * as cdk from 'aws-cdk-lib';
import * as oam from 'aws-cdk-lib/aws-oam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import { SourceStackProps } from './types';

export class SourceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SourceStackProps) {
    super(scope, id, props);

    // Sink ARN resolution
    let sinkArn: string;
    if (props.sinkArn) {
      sinkArn = props.sinkArn;
    } else if (props.ssmParameterName) {
      sinkArn = ssm.StringParameter.valueForStringParameter(this, props.ssmParameterName);
    } else {
      throw new Error('Sink ARN must be provided via context or SSM parameter');
    }

    // OAM Link
    new oam.CfnLink(this, 'OamLink', {
      sinkIdentifier: sinkArn,
      resourceTypes: ['AWS::CloudWatch::Metric'],
      labelTemplate: '$AccountName',
    });

    // Service-Linked Role via Custom Resource
    const slrLambda = new lambda.Function(this, 'ServiceLinkedRoleFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { IAMClient, CreateServiceLinkedRoleCommand } = require('@aws-sdk/client-iam');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  const requestType = event.RequestType;
  if (requestType === 'Create' || requestType === 'Update') {
    const client = new IAMClient({});
    try {
      await client.send(new CreateServiceLinkedRoleCommand({
        AWSServiceName: 'cloudwatch-crossaccount.amazonaws.com',
      }));
      console.log('Service-linked role created successfully.');
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('already exists') || msg.includes('has been taken')) {
        console.log('Service-linked role already exists — this is fine.');
      } else {
        console.error('Unexpected error:', err);
        throw err;
      }
    }
  }
  // Return empty object — CDK Provider framework handles cfn-response
  return {};
};
      `.trim()),
    });

    slrLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iam:CreateServiceLinkedRole'],
      resources: ['*'],
    }));

    const provider = new cr.Provider(this, 'ServiceLinkedRoleProvider', {
      onEventHandler: slrLambda,
    });

    new cdk.CustomResource(this, 'ServiceLinkedRole', {
      serviceToken: provider.serviceToken,
    });

    // cdk-nag suppressions for legitimate patterns
    NagSuppressions.addResourceSuppressions(slrLambda, [
      { id: 'AwsSolutions-IAM4', reason: 'Lambda basic execution role is required for CloudWatch Logs access' },
      { id: 'AwsSolutions-IAM5', reason: 'iam:CreateServiceLinkedRole requires Resource: * as the role ARN is not known ahead of time' },
      { id: 'AwsSolutions-L1', reason: 'NODEJS_20_X is the latest supported inline code runtime in CDK' },
    ], true);

    NagSuppressions.addResourceSuppressions(provider, [
      { id: 'AwsSolutions-IAM4', reason: 'CDK custom resource provider framework requires AWSLambdaBasicExecutionRole managed policy' },
      { id: 'AwsSolutions-IAM5', reason: 'CDK custom resource provider framework uses wildcard for invoke permissions on the handler' },
      { id: 'AwsSolutions-L1', reason: 'CDK custom resource provider framework controls its own Lambda runtime version' },
    ], true);
  }
}
