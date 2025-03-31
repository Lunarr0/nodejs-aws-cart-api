import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC Configuration with Public and Private Subnets
    const vpc = new ec2.Vpc(this, 'Vpc', {
      
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ]
    });

    // DB Credentials Secret with static password
    const dbCredentialsSecret = new secretsmanager.Secret(this, 'DBCredentialsSecret', {
      secretName: 'DBCredentials',
      secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
        username: process.env.DB_USER || "tpostgre",
        password: process.env.DB_PASS || "secure_password_",
      })),
    });

    // Lambda Role
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        'vpc-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
                'ec2:AssignPrivateIpAddresses',
                'ec2:UnassignPrivateIpAddresses'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Security Group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda function',
      allowAllOutbound: true,
    });

    // Allow inbound traffic
    lambdaSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allTraffic(),
      'Allow inbound traffic from all sources'
    );

    // Lambda Function
  // Lambda Function configuration
  const nestLambda = new lambda.Function(this, 'NestJsLambda', {
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: 'lambda.handler',
    code: lambda.Code.fromAsset(path.join(__dirname, '../../dist')), // No bundling!
    timeout: cdk.Duration.seconds(30),
    vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
    },
    securityGroups: [lambdaSecurityGroup],
    environment: {
      NODE_ENV: 'production',
      DB_HOST: process.env.DB_HOST || '',
      DB_PORT: process.env.DB_PORT || '5432',
      DB_USER: process.env.DB_USER || '',
      DB_NAME: process.env.DB_NAME || '',
      SECRETS_ARN: dbCredentialsSecret.secretArn
    },
    memorySize: 1024,
    role: lambdaRole,
  });
  
  
  
 

    // Grant Lambda access to read secrets
    dbCredentialsSecret.grantRead(nestLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'CartApi', {
      restApiName: 'Cart Service',
      description: 'This is the Cart API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.days(1),
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Create proxy integration with Lambda
    const lambdaIntegration = new apigateway.LambdaIntegration(nestLambda, {
      proxy: true,
    });

    // Add proxy resource to handle all routes
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: 'CartApiUrl',
    });

    new cdk.CfnOutput(this, 'LambdaArn', {
      value: nestLambda.functionArn,
      description: 'Lambda Function ARN',
      exportName: 'CartLambdaArn',
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: dbCredentialsSecret.secretArn,
      description: 'Database Credentials Secret ARN',
      exportName: 'DBCredentialsSecretArn',
    });
  }
}



