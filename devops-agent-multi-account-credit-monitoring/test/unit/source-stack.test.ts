import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SourceStack } from '../../lib/source-stack';

/** Helper: creates a SourceStack with a test sink ARN */
function createTestStack() {
  const app = new cdk.App();
  const stack = new SourceStack(app, 'TestSourceStack', {
    sinkArn: 'arn:aws:oam:us-east-1:123456789012:sink/test-sink-id',
  });
  const template = Template.fromStack(stack);
  return { app, stack, template };
}

describe('SourceStack', () => {
  test('contains OAM Link with CloudWatch Metric resource type', () => {
    const { template } = createTestStack();

    template.hasResourceProperties('AWS::Oam::Link', {
      ResourceTypes: ['AWS::CloudWatch::Metric'],
    });
  });

  test('contains custom resource for Service-Linked Role', () => {
    const { template } = createTestStack();

    // Lambda function for SLR creation
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
    });

    // Custom resource that triggers the SLR Lambda
    template.hasResource('AWS::CloudFormation::CustomResource', {});
  });

  test('Sink ARN from props is used in OAM Link SinkIdentifier', () => {
    const { template } = createTestStack();

    template.hasResourceProperties('AWS::Oam::Link', {
      SinkIdentifier: 'arn:aws:oam:us-east-1:123456789012:sink/test-sink-id',
    });
  });

  test('throws error when neither sinkArn nor ssmParameterName provided', () => {
    const app = new cdk.App();

    expect(() => {
      new SourceStack(app, 'FailStack', {});
    }).toThrow('Sink ARN must be provided via context or SSM parameter');
  });
});
