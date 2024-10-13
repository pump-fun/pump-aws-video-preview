// codestar-policy.ts
import * as iam from 'aws-cdk-lib/aws-iam';

export const codestarPolicy: iam.PolicyStatement[] = [
  new iam.PolicyStatement({
    actions: ['codestar-connections:UseConnection'],
    resources: ['arn:aws:codestar-connections:eu-west-1:026090514274:connection/05238017-e095-418b-a90d-8613673f6e99'],
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