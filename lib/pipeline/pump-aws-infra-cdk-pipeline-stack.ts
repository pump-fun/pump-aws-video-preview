import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { codestarPolicy } from './codestar-policy';
import { VideoPreviewStage } from '../pump-media/stage/video-preview-stage';

export class PumpAwsInfraCdkPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'PumpAwsInfraCdkPipeline', {
      pipelineName: 'PumpAwsInfraCdkPipelineStack',
      crossAccountKeys: true,
      codeBuildDefaults: {
        rolePolicy: codestarPolicy
      },
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection('pump-fun/pump-aws-video-preview', 'main', { connectionArn: 'arn:aws:codestar-connections:eu-west-1:026090514015:connection/05238017-e095-418b-a90d-8613673f6e99' }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),

    });


    const localWave = pipeline.addWave('Local');


    localWave.addStage(new VideoPreviewStage(this, "Local", {
      env: { account: "026090514015", region: "eu-west-1" },
      environment: "Local"
    }));
  }
}
