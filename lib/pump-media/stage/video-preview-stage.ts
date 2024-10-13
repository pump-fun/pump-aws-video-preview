import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { VideoPreviewStack } from '../stack/video-preview-stack';


export interface PumpPipelineStageProps extends cdk.StageProps {
  environment: string;
}

export class VideoPreviewStage extends cdk.Stage {

    constructor(scope: Construct, id: string, props: PumpPipelineStageProps) {
      super(scope, id, props);

      const videoPreviewStage = new VideoPreviewStack(this, 'Video-preview', {
        'environment': props?.environment
      });
    }
}