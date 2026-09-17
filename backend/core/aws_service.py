import boto3


def get_ec2_instances():
    ec2 = boto3.client("ec2", region_name="us-east-1")

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
    ec2 = boto3.client("ec2", region_name="us-east-1")

    response = ec2.start_instances(
        InstanceIds=[instance_id]
    )

    return response["StartingInstances"][0]


def stop_ec2_instance(instance_id):
    ec2 = boto3.client("ec2", region_name="us-east-1")

    response = ec2.stop_instances(
        InstanceIds=[instance_id]
    )

    return response["StoppingInstances"][0]
