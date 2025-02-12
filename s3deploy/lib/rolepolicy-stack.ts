import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3_assets from 'aws-cdk-lib/aws-s3-assets'
import * as path from 'path';


export class RolepolicyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = cdk.Aws.ACCOUNT_ID

    const bucket = new s3.Bucket(this, 'CreateBucket', {
      bucketName: `pinpoint-work-${accountId}`,
      versioned: true,
    });
    cdk.Tags.of(bucket).add('author', `ozaki`);

    //既存のバケットを指定する場合
    const bucket2 = s3.Bucket.fromBucketName(this, 'ImportedBucket', 'ozaoza-0010');

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
    new cdk.CfnOutput(this, "out-paramA", { value: new cdk.CfnParameter(this, 'paramA').value.toString()})
/*
    new cdk.CfnOutput(this, "S3BucketName", { value: asset.s3BucketName });
    new cdk.CfnOutput(this, "S3ObjectKey", { value: asset.s3ObjectKey });
    new cdk.CfnOutput(this, "S3HttpURL", { value: asset.httpUrl });
    new cdk.CfnOutput(this, "S3ObjectURL", { value: asset.s3ObjectUrl });
*/
    const pinpoint_policy_json = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AllowUserToSeeBucketListInTheConsole",
          "Action": [
            "s3:ListAllMyBuckets",
            "s3:GetBucketLocation"
          ],
          "Effect": "Allow",
          "Resource": ["arn:aws:s3:::*"]
        },
        {
          "Sid": "AllowRootAndHomeListingOfBucket",
          "Action": [
            "s3:ListBucket"
          ],
          "Effect": "Allow",
          "Resource": [`${bucket.bucketArn}`],
          "Condition": {
            "StringEquals": {
              "s3:delimiter": ["/"],
              "s3:prefix": [
                "",
                "Exports/"
              ]
            }
          }
        },
        {
          "Sid": "AllowListingOfUserFolder",
          "Action": [
            "s3:ListBucket"
          ],
          "Effect": "Allow",
          "Resource": [`${bucket.bucketArn}`],
          "Condition": {
            "StringLike": {
              "s3:prefix": [
                "Exports/*"
              ]
            }
          }
        },
        {
          "Sid": "AllowAllS3ActionsInUserFolder",
          "Action": ["s3:*"],
          "Effect": "Allow",
          "Resource": [`${bucket.bucketArn}/Exports/*`]
        }
      ]
    }


    const policyDocument=iam.PolicyDocument.fromJson(pinpoint_policy_json)




    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('pinpoint.amazonaws.com'),   // required
    });

  }
}
