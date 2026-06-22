import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SourceStack } from '../source-stack';

export interface SourceAccountStageProps extends cdk.StageProps {
  sinkArn?: string;
  ssmParameterName?: string;
}

export class SourceAccountStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: SourceAccountStageProps) {
    super(scope, id, props);

    new SourceStack(this, 'SourceStack', {
      sinkArn: props.sinkArn,
      ssmParameterName: props.ssmParameterName,
    });
  }
}
