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
      ipAddresses: ec2.IpAddresses.cidr('172.16.0.0/16'), // Using 172.16.x.x range
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

    // Lambda Function Configuration
    const nestLambda = new lambda.Function(this, 'NestJsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda.handler', // This should match your Webpack output (dist/src/lambda.js)
      code: lambda.Code.fromAsset(path.join(__dirname, '../../'), { // Ensure it points to the correct output directory
        exclude: [
          '.git',
          'test',
          'infra',
          'cdk.out',
          '.env*',
          'coverage',
          'README.md',
          '.DS_Store',
          'npm-debug.log',
          'yarn-debug.log',
          'yarn-error.log',
          '.npm',
          '.yarn'
        ],
        bundling: {
          image: cdk.DockerImage.fromRegistry('dummy'), // Placeholder, you can use local bundling if needed
          command: ['echo "Docker not used"'],
          local: {
            tryBundle(outputDir: string) {
              try {
                const projectRoot = path.join(__dirname, '../..');
                const commands = [
                  // Copy the compiled code
                  `cp  ${projectRoot}/dist/lambda.js ${outputDir}/lambda.js`,
                  // Copy package files
                  `cp ${projectRoot}/package.json ${outputDir}/`,
                  `cp ${projectRoot}/package-lock.json ${outputDir}/`,
                  // Install production dependencies in the output directory
                  `cd ${outputDir}`,
                  'npm install --omit=dev',
                  // Clean up unnecessary files
                  'rm -rf node_modules/@types',
                  'rm -rf node_modules/*/README.md',
                  'rm -rf node_modules/*/CHANGELOG.md',
                  'rm -rf node_modules/*/LICENSE'
                ];
                
                for (const command of commands) {
                  console.log(`Executing: ${command}`);
                  require('child_process').execSync(command, {
                    stdio: 'inherit',
                    env: { ...process.env, NODE_ENV: 'production' }
                  });
                }
                return true;
              } catch (error) {
                console.error('Local bundling failed:', error);
                throw error;
              }
            }
          }
        }
      }),
      timeout: cdk.Duration.seconds(30),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        NODE_ENV: 'production',
        DB_HOST: process.env.DB_HOST || 'database-1.cofasu0aiudo.us-east-1.rds.amazonaws.com',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_USER: process.env.DB_USER || 'tpostgre',
        DB_NAME: process.env.DB_NAME || 'tcartdb',
        DB_PASS: dbCredentialsSecret.secretArn
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
      timeout: cdk.Duration.seconds(29), // API Gateway timeout (must be less than Lambda timeout)
      allowTestInvoke: true,
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
      ],
    });

    // Add your API resources and methods
const apiResource = api.root.addResource('api');

// Auth routes
const authResource = apiResource.addResource('auth');
const loginResource = authResource.addResource('login');
loginResource.addMethod('POST', lambdaIntegration, {
  methodResponses: [
    {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    },
  ],
});

const registerResource = authResource.addResource('register');
registerResource.addMethod('POST', lambdaIntegration, {
  methodResponses: [
    {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    },
  ],
});

// Profile and cart routes
const profileResource = apiResource.addResource('profile');
profileResource.addMethod('GET', lambdaIntegration, {
  authorizationType: apigateway.AuthorizationType.IAM, // Or COGNITO if you're using AWS Cognito
});

const cartResource = profileResource.addResource('cart');
['GET', 'PUT', 'DELETE'].forEach(method => {
  cartResource.addMethod(method, lambdaIntegration, {
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      },
    ],
  });
});

// Order routes
const orderResource = cartResource.addResource('order');
['PUT', 'GET'].forEach(method => {
  orderResource.addMethod(method, lambdaIntegration);
});

const ordersResource = apiResource.addResource('orders');
['GET', 'POST'].forEach(method => {
  ordersResource.addMethod(method, lambdaIntegration);
});

// Order ID routes
const orderIdResource = ordersResource.addResource('{id}');
orderIdResource.addMethod('GET', lambdaIntegration);

const historyResource = orderIdResource.addResource('history');
historyResource.addMethod('GET', lambdaIntegration);

const orderStatusResource = orderIdResource.addResource('status');
orderStatusResource.addMethod('PUT', lambdaIntegration);

// Health check
api.root.addMethod('GET', lambdaIntegration);

// Add API ID to stack outputs
new cdk.CfnOutput(this, 'ApiId', {
  value: api.restApiId,
  description: 'API Gateway ID',
  exportName: 'CartApiId',
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
 