import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';


//import * as aws-lambda from 'aws-lambda'
/*
npm i "@types/aws-sdk" "@types/aws-lambda" "@types/node" 

*/



export class GetAppsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    //------------------------------　./lambda/index.ts を追加する
    // (Function)
    const funcA = new lambda.Function(this, 'pinpointgetApps', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(15),
      description: 'pinpoint getApps',
    });

    // (Role)
    const funcA_Role = funcA.role as iam.Role;
    funcA_Role.addToPolicy( // 自分で作ったポリシーを追加
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "mobiletargeting:*"
        ],
        resources: [
          `arn:aws:mobiletargeting:${region}:${accountId}:apps/*`,
        ]
      })
    )
  }
}