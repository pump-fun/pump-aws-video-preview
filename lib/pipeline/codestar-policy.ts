// codestar-policy.ts
import * as iam from 'aws-cdk-lib/aws-iam';

export const codestarPolicy: iam.PolicyStatement[] = [
  new iam.PolicyStatement({
    actions: ['codestar-connections:UseConnection'],
    resources: ['arn:aws:codeconnections:eu-west-1:026090514274:connection/0ca3e723-5de5-40a8-9199-edfa575dc36f'],
    effect: iam.Effect.ALLOW,
  }),
  new iam.PolicyStatement({
    actions: [
      'appconfig:StartDeployment',
      'appconfig:GetDeployment',
      'appconfig:StopDeployment',
    ],
    resources: ['*'],
    effect: iam.Effect.ALLOW,
  }),
  new iam.PolicyStatement({
    actions: ['codecommit:GetRepository'],
    resources: ['*'],
    effect: iam.Effect.ALLOW,
  }),
];