#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SampleInfraStack } from '../lib/sample-infra-stack';
import { Stack } from 'aws-cdk-lib';
import { LogBucket } from '../lib/shared-lib/constructs/log-bucket';

const app = new cdk.App();
new SampleInfraStack(app, 'SampleInfraStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
const projectName = "sample-project";
//Naming convention because S3 bucket
//stack for enviroment agnostic
const sharedReourcesStack = new Stack(app, `${projectName}-shared-resources`, {
  description: "AWS Resources that are through out the account but is enviroment agnostic"
});

new LogBucket(sharedReourcesStack, `log-bucket`, {
  logBucketName: `${projectName}-${app.region}-${app.account}-logs`
})
//stack for main env
//stack for sub main env
