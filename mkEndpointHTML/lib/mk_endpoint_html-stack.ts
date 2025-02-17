import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
/*
npm i "@types/aws-sdk" "@types/aws-lambda" "@types/node" 

*/



export class MkEndpointHtmlStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = cdk.Stack.of(this).account;


    const exportRole = "arn:aws:iam::422364499058:role/RolepolicyStack-CreatePinpointExportRole4D505E98-ojfSNBCAkt4q"
//RolepolicyStack.S3Bucket = pinpoint-importexport-job-bucket-422364499058
//RolepolicyStack.pinpointExportRoleArn = arn:aws:iam::422364499058:role/RolepolicyStack-CreatePinpointExportRole4D505E98-ojfSNBCAkt4q
//RolepolicyStack.pinpointImportRoleArn = arn:aws:iam::422364499058:role/RolepolicyStack-CreatePinpointImportRoleC201ACE0-55VuGf70QKqf
    //------------------------------　./lambda/index.ts を追加する
    // (Function)
    const funcA = new lambda.Function(this, 'MkEndpointHtml', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(150),
      functionName: 'mkEndpointHtml',
      description: 'MkEndpointHtmlStack',
      environment: {
        PINPOINT_APPLICATION_ID: "9b74f4a3e06944008aa882015447c15f",
        S3_BUCKET_NAME: `pinpoint-importexport-job-bucket-${accountId}`,
        EXPORT_ROLE_ARN: exportRole
      }
    });

    funcA.addPermission('PinpointInvoke', {
      principal: new iam.ServicePrincipal('pinpoint.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: `arn:aws:mobiletargeting:${this.region}:${this.account}:apps/*`,
    });



    // (Role)
    const funcA_Role = funcA.role as iam.Role;
    // add entry to trasted policy 
    funcA_Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sts:AssumeRole', 'iam:PassRole'], //,'iam:GetRole','iam:GetRolePolicy','iam:ListRolePolicies','iam:ListRoles','iam:ListAttachedRolePolicies',],
        resources: [exportRole]
      })
    )

    funcA_Role.addManagedPolicy(// 用意してくれているポリシーを追加
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess")
    )
    funcA_Role.addToPolicy( // 自分で作ったポリシーを追加
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:*"
        ],
        resources: [
         // `arn:aws:s3::*:pinpoint-importexport-job-bucket-${accountId}`,
          `arn:aws:s3::*:pinpoint-importexport-job-bucket-${accountId}/Exports`,
          `arn:aws:s3::*:pinpoint-importexport-job-bucket-${accountId}/Exports/*`,
        ]
      })
    )
    funcA_Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "mobiletargeting:*"
        ],
        resources: [
          "*",
        ]
      })
    )
  }
}