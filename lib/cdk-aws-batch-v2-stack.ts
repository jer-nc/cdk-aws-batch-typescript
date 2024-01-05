import * as cdk from 'aws-cdk-lib';
import { CfnComputeEnvironment, CfnJobDefinition, CfnJobQueue } from 'aws-cdk-lib/aws-batch';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { CfnInstanceProfile, CompositePrincipal, ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';


export class CdkAwsBatchV2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const jobDefinitionName = 'aws-batch-cdk-job-definition';
    const jobQueueName = 'aws-batch-cdk-job-queue';
    const computeEnvName = 'aws-batch-compute-environment';
    const dockerBaseImage = 'davsblg/docker-hello:latest'; // docker image from docker hub

    const vpc = new Vpc(this, 'batch-job-vpc', { maxAzs: 2 });

    const sg = new SecurityGroup(this, 'batch-job-security-group', {
      vpc,
      securityGroupName: 'aws-batch-job-security-group',
      allowAllOutbound: true,
    });

    const batchInstanceRole = new Role(this, 'batch-job-instance-role', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal('ec2.amazonaws.com'),
        new ServicePrincipal('ecs.amazonaws.com'),
        new ServicePrincipal('ecs-tasks.amazonaws.com'),
      ),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
      ],
    });

    const batchServiceRole = new Role(this, 'BatchServiceRole', {
      assumedBy: new ServicePrincipal('batch.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole'),
      ],
    });

    const batchInstanceProfile = new CfnInstanceProfile(this, 'InstanceProfile', {
      roles: [batchInstanceRole.roleName],
    });

    const computeEnvironment = new CfnComputeEnvironment(this, 'ComputeEnvironment', {
      type: 'MANAGED',
      serviceRole: batchServiceRole.roleArn,
      computeEnvironmentName: computeEnvName,
      computeResources: {
        minvCpus: 0,
        maxvCpus: 256,
        desiredvCpus: 0,
        instanceTypes: ['optimal'],
        subnets: vpc.privateSubnets.map(subnet => subnet.subnetId),
        securityGroupIds: [sg.securityGroupId],
        instanceRole: batchInstanceProfile.attrArn,
        type: 'EC2'
      },
      state: 'ENABLED',
    });

    const jobQueue = new CfnJobQueue(this, 'JobQueue', {
      jobQueueName: jobQueueName,
      computeEnvironmentOrder: [{
        order: 1,
        computeEnvironment: computeEnvironment.ref,
      }],
      priority: 1,
      state: 'ENABLED',
    });

    const batchJobDefinition = new CfnJobDefinition(this, 'job-definition', {
      type: 'container',
      jobDefinitionName: jobDefinitionName,
      containerProperties: {
        image: dockerBaseImage,
        vcpus: 2,
        memory: 2000,
      },
      retryStrategy: {
        attempts: 1,
      },
    });

    jobQueue.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    batchJobDefinition.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    computeEnvironment.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    batchServiceRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    batchInstanceProfile.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    sg.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

  }
}
