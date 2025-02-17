import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'


export class RolepolicyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    

    // for pinpoint import/export job
    // Amazon Pinpoint - 開発者ガイド
    // https://docs.aws.amazon.com/ja_jp/pinpoint/latest/developerguide/pinpoint-dg.pdf

    // エンドポイントまたはセグメントをインポートするための IAM ロール
    // エンドポイントまたはセグメントをエクスポートするための IAM ロール
    

    // get accoutid
    const accountId = cdk.Stack.of(this).account;

    // create s3 bucket
    const bucketName = `pinpoint-importexport-job-bucket-${accountId}`;


    const s3bucket = new s3.Bucket(this, 'CreateImportExportJobBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: `${bucketName}`
    });

    //============================Import Role

    const u_pinpointImportRole = new iam.Role(this, 'CreatePinpointImportRole', {
      assumedBy: new iam.ServicePrincipal('pinpoint.amazonaws.com')
    })

    // add AmazonS3ReadOnlyAccess policy to the role
    u_pinpointImportRole
      .addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));

    // ============================Export Role

    const u_pinpointExportRole = new iam.Role(this, 'CreatePinpointExportRole', {
      assumedBy: new iam.ServicePrincipal('pinpoint.amazonaws.com')
    })

    // add full paccsess to pinpoint
    u_pinpointExportRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['mobiletargeting:*'],
      resources: ['*']
    }));
    // AllowUserToSeeBucketListInTheConsole
    u_pinpointExportRole.addToPolicy(new iam.PolicyStatement({
      
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListAllMyBuckets', 's3:GetBucketLocation'],
      resources: ["arn:aws:s3:::*"],
    }));

    // AllowRootAndHomeListingOfBucket    
    u_pinpointExportRole.addToPolicy(new iam.PolicyStatement({
      
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListBucket'],
      resources: [`arn:aws:s3:::${s3bucket.bucketName}`],
      conditions: {
        StringLike: {
          's3:prefix': ['', 'Exports/']
        }
      }
    }));

    // AllowListingOfUserFolder
    u_pinpointExportRole.addToPolicy(new iam.PolicyStatement({
      
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListBucket'],
      resources: [`arn:aws:s3:::${s3bucket.bucketName}`],
      conditions: {
        StringLike: {
          's3:prefix': ['Exports/*']
        }
      }
    }));

       // クロススタック用にS3Bucket名  をエクスポート
    new cdk.CfnOutput(this, 'S3Bucket', {
      value: s3bucket.bucketName,
      exportName: 'S3Bucket' // クロススタック用にエクスポート
      });

    // クロススタック用にu_pinpointImportRole をエクスポート Export name must only include alphanumeric characters, colons, or hyphens (got 'u_pinpointImportRoleArn')
    new cdk.CfnOutput(this, 'pinpointImportRoleArn', {
      value: u_pinpointImportRole.roleArn,
      exportName: 'pinpointImportRoleArn' 
    });

    // クロススタック用にu_pinpointExportRole をエクスポート
    new cdk.CfnOutput(this, 'pinpointExportRoleArn', {
      value: u_pinpointExportRole.roleArn,
      exportName: 'pinpointExportRoleArn' 
    });
  }
}
