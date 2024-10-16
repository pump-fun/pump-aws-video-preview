#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VideoPreviewStack } from '../lib/pump-media/stack/video-preview-stack';
import { PumpAwsVideoCdkPipelineStack } from '../lib/pipeline/pump-aws-video-cdk-pipeline-stack';

const app = new cdk.App();
// new VideoPreviewStack(app, "Devnet-video-preview", {
//   env: { account: "026090514348", region: "us-east-1" },
//   environment: "Devnet"
// })

new PumpAwsVideoCdkPipelineStack(app, "Video-Pipeline", {
  env: { account: "026090514274", region: "eu-west-1" },
})

app.synth();