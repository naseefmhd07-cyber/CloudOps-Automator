import boto3


def get_ec2_instances():
    ec2 = boto3.client("ec2", region_name="ap-south-1")

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
                "public_ip": instance.get("PublicIpAddress", "No Public IP"),
                "private_ip": instance.get("PrivateIpAddress", "No Private IP"),
            })

    return instances