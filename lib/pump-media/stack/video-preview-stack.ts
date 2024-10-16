import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { PumpPipelineStageProps } from "../stage/video-preview-stage";
import { EnvConfig } from "../../config/EnvConfig";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cr from "aws-cdk-lib/custom-resources";

export class VideoPreviewStack extends cdk.Stack {
  public ffmpegLayer: cdk.aws_lambda.LayerVersion;
  constructor(scope: Construct, id: string, props: PumpPipelineStageProps) {
    super(scope, id, props);

    const config = EnvConfig.forEnv(props.environment);
    const videoS3BucketCertificateARN = config.videoS3BucketCertificateARN;
    const environment = config.envName;

    const bucketName =
      environment === "Prod"
        ? "media.pump.fun"
        : environment === "Devnet"
        ? "media-devnet.pump.fun"
        : environment === "Local"
        ? "media-local.pump.fun"
        : "";
    const ffmpegLayer = new lambda.LayerVersion(this, "FFmpegLayer", {
      code: lambda.Code.fromAsset("lib/pump-media/lambda-layer/ffmpeg"),
      description: "FFmpeg and FFprobe binaries",
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
    });
    this.ffmpegLayer = ffmpegLayer;

    this.setUpVideoPreview(
      "video-preview-" + environment,
      "../lambda/video-preview-lambda.ts",
      environment,
      videoS3BucketCertificateARN,
      bucketName,
      config.account
    );
  }

  private setUpVideoPreview(
    lambdaId: string,
    lambdaPath: string,
    environment: string,
    videoS3BucketCertificateARN: string,
    bucketName: string,
    account: string
  ) {
    const certificateArnString = videoS3BucketCertificateARN;
    const userName =
      environment === "Prod"
        ? "pump-client-s3-prod"
        : environment === "Devnet"
        ? "pump-client-s3-devnet"
        : environment === "Local"
        ? "pump-client-s3-local"
        : "";

    const bucket = s3.Bucket.fromBucketName(this, "S3Bucket", bucketName);

    const bucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [
        new iam.ArnPrincipal(`arn:aws:iam::${account}:user/${userName}`),
      ],
      actions: ["s3:PutObject"],
      resources: [`${bucket.bucketArn}/*`],
    });

    const publicReadPolicy = new iam.PolicyStatement({
      sid: "PublicReadGetObject",
      effect: iam.Effect.ALLOW,
      principals: [new iam.StarPrincipal()],
      actions: ["s3:GetObject"],
      resources: [`${bucket.bucketArn}/*`],
    });

    // Define the CORS configuration
    const corsConfig = [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
        AllowedOrigins: ["*"],
        ExposeHeaders: ["ETag"],
        MaxAge: 3000,
      },
    ];

    // Create a custom resource to apply the CORS configuration
    new cr.AwsCustomResource(this, "ApplyCORSConfigurationToBucket", {
      onCreate: {
        service: "S3",
        action: "putBucketCors",
        parameters: {
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: corsConfig,
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of("CORSConfigurationUpdate"),
      },
      onUpdate: {
        service: "S3",
        action: "putBucketCors",
        parameters: {
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: corsConfig,
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of("CORSConfigurationUpdate"),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [bucket.bucketArn],
      }),
    });

    // Create a custom resource to apply the bucket policy
    new cr.AwsCustomResource(this, "ApplyBucketPolicy", {
      onCreate: {
        service: "S3",
        action: "putBucketPolicy",
        parameters: {
          Bucket: bucketName,
          Policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [bucketPolicy.toJSON(), publicReadPolicy.toJSON()],
          }),
        },
        physicalResourceId: cr.PhysicalResourceId.of("BucketPolicyUpdate"),
      },
      onUpdate: {
        service: "S3",
        action: "putBucketPolicy",
        parameters: {
          Bucket: bucketName,
          Policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [bucketPolicy.toJSON(), publicReadPolicy.toJSON()],
          }),
        },
        physicalResourceId: cr.PhysicalResourceId.of("BucketPolicyUpdate"),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [bucket.bucketArn],
      }),
    });

    // Ensure the custom resources complete before using the bucket
    // bucket.node.addDependency(bucketCustomResource);
    const lambdaExecutionRole = new iam.Role(this, `${lambdaId}ExecutionRole`, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["cloudwatch:PutMetricData"],
        resources: ["*"],
      })
    );

    const previewLambda = new lambdaNodeJs.NodejsFunction(this, lambdaId, {
      entry: path.join(__dirname, lambdaPath),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(900),
      role: lambdaExecutionRole,
      memorySize: 10240,
      layers: [this.ffmpegLayer],
      environment: {
        BUCKET_NAME: bucket.bucketName,
        THUMBNAIL_FOLDER: "previews/",
        PATH: "/opt/bin:/usr/local/bin:/usr/bin:/bin",
        FFMPEG_PATH: "/opt/bin/ffmpeg",
        FFPROBE_PATH: "/opt/bin/ffprobe",
      },
      bundling: {
        externalModules: [
          "/opt/bin/ffmpeg", // In the Lambda Layer
          "/opt/bin/ffprobe", // In the Lambda Layer
        ],
      },
    });

    bucket.grantReadWrite(lambdaExecutionRole);

    const videoFormats = [".mp4", ".avi", ".mkv", ".webm"];
    // Add S3 event notification for each video format
    videoFormats.forEach((format) => {
      bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.LambdaDestination(previewLambda),
        { prefix: "videos/", suffix: format }
      );
    });
    const corsFunction = new cloudfront.Function(
      this,
      `CorsFunction${environment}`,
      {
        code: cloudfront.FunctionCode.fromFile({
          filePath: path.join(__dirname, "../cors-function/cors-function.js"),
        }),
      }
    );

    // Get the certificate ARN from context
    const certificateArn = certificateArnString;
    if (!certificateArn) {
      throw new Error(
        `Certificate ARN for ${environment} environment is not provided`
      );
    }
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      `Certificate${environment}`,
      certificateArn
    );

    const distribution = new cloudfront.Distribution(
      this,
      `Distribution-s3-${environment}`,
      {
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
          functionAssociations: [
            {
              function: corsFunction,
              eventType: cloudfront.FunctionEventType.VIEWER_RESPONSE,
            },
          ],
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        },
        domainNames: [bucketName],
        certificate: certificate,
      }
    );

    // Output the CloudFront URL
    new cdk.CfnOutput(this, `DistributionDomainName${environment}`, {
      value: distribution.distributionDomainName,
      description: `CloudFront Distribution Domain Name for ${environment}`,
    });
  }
}
