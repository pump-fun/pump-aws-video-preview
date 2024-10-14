interface EnvConfigProps {
  envName: string;
  account: string;
  region: string;
  videoS3BucketCertificateARN: string;
}

export class EnvConfig {
  public readonly envName: string;
  public readonly account: string;
  public readonly region: string;
  public readonly videoS3BucketCertificateARN: string;



  constructor(props: EnvConfigProps) {
    this.envName = props.envName;
    this.account = props.account;
    this.region = props.region;
    this.videoS3BucketCertificateARN = props.videoS3BucketCertificateARN;
  }

  static forEnv(envName: string): EnvConfig {
    switch (envName) {
      case 'Local':
        return new EnvConfig({
          envName: 'Local',
          account: '026090514015',
          region: 'eu-west-1',
          videoS3BucketCertificateARN: "arn:aws:acm:us-east-1:026090514015:certificate/5d1250d4-7297-4f35-b2cc-99b0e62da5bc",
        });
      case 'Devnet':
        return new EnvConfig({
          envName: 'Devnet',
          account: '026090514348',
          region: 'eu-west-1',
          videoS3BucketCertificateARN: "arn:aws:acm:us-east-1:026090514348:certificate/cbc319f3-61fa-49de-9583-d020ea08e61e",
        });
      case 'Prod':
        return new EnvConfig({
          envName: 'Prod',
          account: '026090514418',
          region: 'eu-west-1',
          videoS3BucketCertificateARN: "arn:aws:acm:us-east-1:026090514418:certificate/40c32f60-c3c5-4517-9730-849545360bd0",
        });
      default:
        throw new Error(`Unknown environment name: ${envName}`);
    }
  }
}