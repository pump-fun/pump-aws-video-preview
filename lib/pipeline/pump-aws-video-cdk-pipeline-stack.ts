import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { codestarPolicy } from './codestar-policy';
import { VideoPreviewStage } from '../pump-media/stage/video-preview-stage';

export class PumpAwsVideoCdkPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'PumpAwsVideoCdkPipeline', {
      pipelineName: 'PumpAwsVideoCdkPipelineStack',
      crossAccountKeys: true,
      codeBuildDefaults: {
        rolePolicy: codestarPolicy
      },
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection('pump-fun/pump-aws-video-preview', 'master', { connectionArn: 'arn:aws:codeconnections:eu-west-1:026090514274:connection/0ca3e723-5de5-40a8-9199-edfa575dc36f' }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),

    });


    const localWave = pipeline.addWave('Local');


    localWave.addStage(new VideoPreviewStage(this, "Local", {
      env: { account: "026090514015", region: "us-east-1" },
      environment: "Local"
    }));

    const devnetWave = pipeline.addWave('Devnet');


    devnetWave.addStage(new VideoPreviewStage(this, "Devnet", {
      env: { account: "026090514348", region: "us-east-1" },
      environment: "Devnet"
    }));

    const prodWave = pipeline.addWave('Prod');


    prodWave.addStage(new VideoPreviewStage(this, "Prod", {
      env: { account: "026090514418", region: "us-east-1" },
      environment: "Prod"
    }));
  }
}
