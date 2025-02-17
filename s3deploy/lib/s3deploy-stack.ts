import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3_assets from 'aws-cdk-lib/aws-s3-assets'
import * as path from 'path';


export class S3deployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = cdk.Aws.ACCOUNT_ID

   /*
    const bucket = new s3.Bucket(this, 'CreateBucket', {
      bucketName: `pinpoint-work-${accountId}`,
      versioned: true,
    });
    cdk.Tags.of(bucket).add('author', `ozaki`);
    */

    
    //ステートマシンArnのインポート
    //const bucket0 = cdk.Fn.importValue('S3Bucket')??'ozaoza-0010';
    //既存のバケットを指定する場合
    const bucket = s3.Bucket.fromBucketName(this, 'ImportedBucket', 'ozaoza-0010');

    // htmlをS3にデプロイ
    new cdk.aws_s3_deployment.BucketDeployment(this, `BucketDeployment`, {
      sources: [cdk.aws_s3_deployment.Source.asset('./assets')], // npmコマンド実行階層から見てのパス
      destinationBucket: bucket,
    });
    // htmlをS3にデプロイ
    //new cdk.aws_s3_deployment.BucketDeployment(this, `BucketDeployment2`, {
    //  sources: [cdk.aws_s3_deployment.Source.asset('./assets')], // npmコマンド実行階層から見てのパス
    //  destinationBucket: bucket2,
   // const asset = new s3_assets.Asset(this, 'Asset', {
    //const asset=new cdk.assets.Asset(this,'Asset',{
   //   path: cdk.aws_s3_deployment.Source.asset('./assets').toString()
    //})
/*    
    new cdk.CfnOutput(this, "S3BucketName", { value: asset.s3BucketName });
    new cdk.CfnOutput(this, "S3ObjectKey", { value: asset.s3ObjectKey });
    new cdk.CfnOutput(this, "S3HttpURL", { value: asset.httpUrl });
    new cdk.CfnOutput(this, "S3ObjectURL", { value: asset.s3ObjectUrl });
*/
    
  }
}
