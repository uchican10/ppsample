import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

/*
npm i "@types/aws-sdk" "@types/aws-lambda" "@types/node" 

*/



export class SetMessageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //------------------------------　./lambda/index.ts を追加する
    // (Function)
    const funcA = new lambda.Function(this, 'funcA', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(15),
      description: 'set message to pinpoint campaign',
      environment: {
        'applicationId': 'xxxxxx-xxx.xxx.xx',
        'campaignId': 'xxxxxx-xxx.xxx.xx',
      }
    });
    // (Role)
    const funcA_Role = funcA.role as iam.Role;
    //    funcA_Role.addManagedPolicy(// 用意してくれているポリシーを追加
    //      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess")
    //    )
    //pinpointのポリシーを追加
    funcA_Role.addToPolicy( // 自分で作ったポリシーを追加
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "mobiletargeting:*",
        ],
        resources: [
          "*"
        ]
      })
    )
  }
}
//------------------------------　./lambda/index.ts を追加する
