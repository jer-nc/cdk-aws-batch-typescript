# AWS Batch AWS CDK v2 - Typescript

This project is an experiment that utilizes AWS CDK (Cloud Development Kit) to set up an AWS Batch infrastructure, enabling batch job execution using Docker containers.

## Description

The code provided in this repository creates an AWS CDK stack that configures the following components:

- **VPC (Virtual Private Cloud)**: Sets up a VPC with two availability zones to host the AWS Batch infrastructure.
- **Security Group**: Configures a security group allowing outbound traffic.
- **AWS IAM Roles**: Defines roles for instances, services, and instance profiles for the AWS Batch environment.
- **Batch Compute Environment**: Establishes a managed compute environment defining the EC2 resources used by AWS Batch.
- **Job Queue**: Creates a job queue to manage AWS Batch tasks.
- **Job Definition**: Defines a container-type job using a public Docker image from Docker Hub.

## Docker Image

This project uses the public image `davsblg/docker-hello:latest`, available on Docker Hub, as the base for containers that will run as jobs in AWS Batch.

In CloudWatch Logs, you should see a `Hello World` print.

## Policies and Roles

> [!NOTE]
> Policies require review as there might be some unnecessary ones. Additional policies were added due to errors. Once thoroughly reviewed, I'll modify and remove the unnecessary ones.