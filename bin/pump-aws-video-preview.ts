#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VideoPreviewStack } from '../lib/pump-media/stack/video-preview-stack';

const app = new cdk.App();
new VideoPreviewStack(app, "Local-video-preview", {
  env: { account: "026090514015", region: "us-east-1" },
  environment: "Local"
})

app.synth();