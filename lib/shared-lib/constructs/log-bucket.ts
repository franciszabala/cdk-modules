import { Construct } from 'constructs';
import { aws_s3 as s3, RemovalPolicy } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

export interface LogBucketProps {
    logBucketName: string;
    /**
     * AWS changed S3 bucket to use new permission model.
     *
     * https://aws.amazon.com/about-aws/whats-new/2022/12/amazon-s3-automatically-enable-block-public-access-disable-access-control-lists-buckets-april-2023/
     *
     */
    useOldPermission?: boolean;
}

export class LogBucket extends Construct {
    public readonly logBucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: LogBucketProps) {
        super(scope, id);
        const useOldPermission = props.useOldPermission ?? false;

        this.logBucket = new s3.Bucket(this, `${this.node.id}-logs-bucket`, {
            bucketName: props.logBucketName,
            accessControl:
                useOldPermission === true
                    ? s3.BucketAccessControl.LOG_DELIVERY_WRITE
                    : undefined,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            versioned: true,
            removalPolicy: RemovalPolicy.RETAIN,
            enforceSSL: true,
        });

        const policyDocs: iam.PolicyStatement[] =
            this.generateLogBucketPolicy(
                this.logBucket
            );
        for (let i = 0; i < policyDocs.length; i++) {
            this.logBucket.addToResourcePolicy(policyDocs[i]);
        }
    }

    private generateLogBucketPolicy(
        targetBucket: s3.Bucket
    ): iam.PolicyStatement[] {
        const s3BucketPolicy: iam.PolicyStatement[] = [];

        s3BucketPolicy.push(
            new iam.PolicyStatement({
                sid: 'AWSLogDeliveryAclCheck',
                actions: ['s3:GetBucketAcl'],
                effect: iam.Effect.ALLOW,
                resources: [`${targetBucket.bucketArn}`],
                principals: [
                    new iam.ServicePrincipal('delivery.logs.amazonaws.com'),
                ],
            })
        );

        s3BucketPolicy.push(
            new iam.PolicyStatement({
                sid: 'AWSLogDeliveryWrite',
                actions: ['s3:PutObject'],
                effect: iam.Effect.ALLOW,
                resources: [
                    `${targetBucket.bucketArn}/AWSLogs/*`,
                    `${targetBucket.bucketArn}/vpc-flow-logs/*`,
                ],
                principals: [
                    new iam.ServicePrincipal('delivery.logs.amazonaws.com'),
                ],
                conditions: {
                    StringEqualsIfExists: {
                        's3:x-amz-acl': ['bucket-owner-full-control'],
                    },
                },
            })
        );

        s3BucketPolicy.push(
            new iam.PolicyStatement({
                sid: 'AWSALBWrite',
                actions: ['s3:PutObject'],
                effect: iam.Effect.ALLOW,
                resources: [`${targetBucket.bucketArn}/*`],
                principals: [
                    new iam.ArnPrincipal('arn:aws:iam::114774131450:root'),
                ],
                conditions: {
                    StringEqualsIfExists: {
                        's3:x-amz-acl': ['bucket-owner-full-control'],
                    },
                },
            })
        );

        s3BucketPolicy.push(
            new iam.PolicyStatement({
                actions: ['s3:PutObject'],
                effect: iam.Effect.ALLOW,
                resources: [`${targetBucket.bucketArn}/*`],
                principals: [
                    new iam.ServicePrincipal('logdelivery.elb.amazonaws.com'),
                ],
                conditions: {
                    StringEqualsIfExists: {
                        's3:x-amz-acl': ['bucket-owner-full-control'],
                    },
                },
            })
        );

        s3BucketPolicy.push(
            new iam.PolicyStatement({
                sid: 'AWSCloudTrailAclCheck20150319',
                actions: ['s3:GetBucketAcl'],
                effect: iam.Effect.ALLOW,
                resources: [`${targetBucket.bucketArn}`],
                principals: [
                    new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
                ],
            })
        );

        s3BucketPolicy.push(
            new iam.PolicyStatement({
                sid: 'AWSCloudTrailWrite20150319',
                actions: ['s3:PutObject'],
                effect: iam.Effect.ALLOW,
                resources: [`${targetBucket.bucketArn}/temp-iam/AWSLogs/*`],
                principals: [
                    new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
                ],
                conditions: {
                    StringEqualsIfExists: {
                        's3:x-amz-acl': ['bucket-owner-full-control'],
                    },
                },
            })
        );

        s3BucketPolicy.push(
            new iam.PolicyStatement({
                sid: 'Put bucket policy needed for audit logging',
                actions: ['s3:PutObject'],
                effect: iam.Effect.ALLOW,
                resources: [`${targetBucket.bucketArn}/*`],
                principals: [
                    new iam.ArnPrincipal('arn:aws:iam::361669875840:user/logs'),
                ],
                conditions: {
                    StringEqualsIfExists: {
                        's3:x-amz-acl': ['bucket-owner-full-control'],
                    },
                },
            })
        );

        s3BucketPolicy.push(
            new iam.PolicyStatement({
                sid: 'Get bucket policy needed for audit logging',
                actions: ['s3:GetBucketAcl'],
                effect: iam.Effect.ALLOW,
                resources: [`${targetBucket.bucketArn}`],
                principals: [
                    new iam.ArnPrincipal('arn:aws:iam::361669875840:user/logs'),
                ],
            })
        );

        s3BucketPolicy.push(
            new iam.PolicyStatement({
                sid: 'S3PolicyStmt-DO-NOT-MODIFY-1663822939021',
                actions: ['s3:PutObject'],
                effect: iam.Effect.ALLOW,
                resources: [`${targetBucket.bucketArn}/*`],
                principals: [
                    new iam.ServicePrincipal('logging.s3.amazonaws.com'),
                ],
            })
        );

        return s3BucketPolicy;
    }
}
