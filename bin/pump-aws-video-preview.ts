#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VideoPreviewStack } from '../lib/pump-media/stack/video-preview-stack';
import { PumpAwsVideoCdkPipelineStack } from '../lib/pipeline/pump-aws-video-cdk-pipeline-stack';

const app = new cdk.App();
// new VideoPreviewStack(app, "Local-video-preview", {
//   env: { account: "026090514015", region: "us-east-1" },
//   environment: "Local"
// })

new PumpAwsVideoCdkPipelineStack(app, "Video-Pipeline", {
  env: { account: "026090514274", region: "eu-west-1" },
})

app.synth();