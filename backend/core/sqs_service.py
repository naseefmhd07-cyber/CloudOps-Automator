import json
import os

import boto3
from django.db import transaction

from .models import Alert


from django.conf import settings

AWS_REGION = settings.AWS_REGION
SQS_QUEUE_URL = settings.SQS_QUEUE_URL

def process_sqs_messages(max_messages=5):
    """
    Read CloudWatch alarm notifications from SQS and create
    corresponding Django Alert records.
    """
    if not SQS_QUEUE_URL:
        raise RuntimeError("SQS_QUEUE_URL environment variable is not configured.")

    sqs = boto3.client("sqs", region_name=AWS_REGION)

    result = sqs.receive_message(
        QueueUrl=SQS_QUEUE_URL,
        MaxNumberOfMessages=max(1, min(max_messages, 10)),
        WaitTimeSeconds=10,
        VisibilityTimeout=60,
    )

    processed = 0

    for message in result.get("Messages", []):
        try:
            body = json.loads(message["Body"])

           
# SNS wraps its published message in an envelope.
if body.get("Type") == "Notification":
    inner_message = body.get("Message", "{}")

    try:
        notification = json.loads(inner_message)
    except (json.JSONDecodeError, TypeError):
        # Ignore plain-text test messages safely.
        notification = {}
else:
    notification = body

if not isinstance(notification, dict):
    notification = {}


            alarm_name = notification.get("AlarmName", "CloudWatch Alarm")
            new_state = notification.get("NewStateValue", "")
            reason = notification.get("NewStateReason", "")

            # Only create dashboard alerts when the alarm enters ALARM.
            if new_state != "ALARM":
                sqs.delete_message(
                    QueueUrl=SQS_QUEUE_URL,
                    ReceiptHandle=message["ReceiptHandle"],
                )
                processed += 1
                continue

            trigger = notification.get("Trigger", {})
            dimensions = trigger.get("Dimensions", [])
            instance_id = next(
                (
                    item.get("value", "")
                    for item in dimensions
                    if item.get("name") == "InstanceId"
                ),
                "",
            )

            with transaction.atomic():
                existing = Alert.objects.filter(
                    alert_type="high_cpu",
                    ec2_instance_id=instance_id,
                    is_read=False,
                    title=alarm_name,
                ).first()

                if not existing:
                    Alert.objects.create(
                        title=alarm_name[:200],
                        message=reason or f"CloudWatch alarm {alarm_name} entered ALARM state.",
                        alert_type="high_cpu",
                        severity="critical",
                        ec2_instance_id=instance_id,
                        server_name=instance_id or "CloudWatch monitored resource",
                    )

            # Delete only after the database transaction succeeds.
            sqs.delete_message(
                QueueUrl=SQS_QUEUE_URL,
                ReceiptHandle=message["ReceiptHandle"],
            )
            processed += 1

        except Exception:
            # Leave failed messages in SQS for retry.
            raise

    return {"processed": processed}