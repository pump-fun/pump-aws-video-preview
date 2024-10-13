interface EnvConfigProps {
  envName: string;
  account: string;
  region: string;
  videoS3BucketCertificateARN: string;
  initialize: boolean;
}

export class EnvConfig {
  public readonly envName: string;
  public readonly account: string;
  public readonly region: string;
  public readonly videoS3BucketCertificateARN: string;
  initialize: boolean;



  constructor(props: EnvConfigProps) {
    this.envName = props.envName;
    this.account = props.account;
    this.region = props.region;
    this.videoS3BucketCertificateARN = props.videoS3BucketCertificateARN;
    this.initialize = props.initialize;
  }

  static forEnv(envName: string): EnvConfig {
    switch (envName) {
      case 'Local':
        return new EnvConfig({
          envName: 'Local',
          account: '026090514015',
          region: 'eu-west-1',
          videoS3BucketCertificateARN: "arn:aws:acm:us-east-1:026090514015:certificate/5d1250d4-7297-4f35-b2cc-99b0e62da5bc",
          initialize: false
        });
      case 'Devnet':
        return new EnvConfig({
          envName: 'Devnet',
          account: '026090514348',
          region: 'eu-west-1',
          videoS3BucketCertificateARN: "arn:aws:acm:us-east-1:026090514015:certificate/3d1e9db9-c639-4fd7-99d1-fb053e217968",
          initialize: false
        });
      case 'Prod':
        return new EnvConfig({
          envName: 'Prod',
          account: '026090514418',
          region: 'eu-west-1',
          videoS3BucketCertificateARN: "arn:aws:acm:us-east-1:026090514418:certificate/40c32f60-c3c5-4517-9730-849545360bd0",
          initialize: false
        });
      default:
        throw new Error(`Unknown environment name: ${envName}`);
    }
  }
}