import boto3
from datetime import datetime, timedelta, timezone


AWS_REGION = "us-east-1"


def get_ec2_instances():
    ec2 = boto3.client("ec2", region_name=AWS_REGION)

    response = ec2.describe_instances()

    instances = []

    for reservation in response["Reservations"]:
        for instance in reservation["Instances"]:

            instance_name = "Unnamed"

            for tag in instance.get("Tags", []):
                if tag["Key"] == "Name":
                    instance_name = tag["Value"]

            instances.append({
                "id": instance["InstanceId"],
                "name": instance_name,
                "state": instance["State"]["Name"],
                "type": instance["InstanceType"],
                "public_ip": instance.get(
                    "PublicIpAddress",
                    "No Public IP"
                ),
                "private_ip": instance.get(
                    "PrivateIpAddress",
                    "No Private IP"
                ),
            })

    return instances


def start_ec2_instance(instance_id):
    ec2 = boto3.client("ec2", region_name=AWS_REGION)

    response = ec2.start_instances(
        InstanceIds=[instance_id]
    )

    return response["StartingInstances"][0]


def stop_ec2_instance(instance_id):
    ec2 = boto3.client("ec2", region_name=AWS_REGION)

    response = ec2.stop_instances(
        InstanceIds=[instance_id]
    )

    return response["StoppingInstances"][0]


def get_ec2_metrics(instance_id):
    """
    Get the latest CloudWatch metrics for an EC2 instance.
    """

    cloudwatch = boto3.client(
        "cloudwatch",
        region_name=AWS_REGION
    )

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(minutes=30)

    metric_names = [
        "CPUUtilization",
        "NetworkIn",
        "NetworkOut",
        "EBSReadOps",
        "EBSWriteOps",
    ]

    metrics = {}

    for metric_name in metric_names:

        response = cloudwatch.get_metric_statistics(
            Namespace="AWS/EC2",
            MetricName=metric_name,
            Dimensions=[
                {
                    "Name": "InstanceId",
                    "Value": instance_id,
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=["Average"],
        )

        datapoints = response.get("Datapoints", [])

        if not datapoints:
            metrics[metric_name] = None
            continue

        latest = max(
            datapoints,
            key=lambda datapoint: datapoint["Timestamp"]
        )

        metrics[metric_name] = {
            "value": latest.get("Average"),
            "timestamp": latest["Timestamp"],
        }

    return metrics


def check_high_cpu(instance_id, threshold=80):
    """
    Check whether an EC2 instance has high CPU utilization.
    Returns the CPU value if it is above the threshold.
    """

    metrics = get_ec2_metrics(instance_id)

    cpu_metric = metrics.get("CPUUtilization")

    if not cpu_metric:
        return None

    cpu_value = cpu_metric.get("value")

    if cpu_value is not None and cpu_value >= threshold:
        return cpu_value

    return None