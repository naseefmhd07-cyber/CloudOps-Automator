from django.core.management.base import BaseCommand

from core.aws_service import get_ec2_instances, check_high_cpu
from core.models import Alert


class Command(BaseCommand):
    help = "Check EC2 CPU usage and create high CPU alerts"

    def handle(self, *args, **options):
        instances = get_ec2_instances()

        checked = 0
        alerts_created = 0

        for instance in instances:
            instance_id = instance["id"]
            instance_name = instance["name"]
            state = instance["state"]

            # Only check running EC2 instances.
            if state != "running":
                continue

            checked += 1

            cpu_value = check_high_cpu(instance_id, threshold=80)

            if cpu_value is None:
                continue

            # Avoid creating duplicate unread alerts.
            existing_alert = Alert.objects.filter(
                alert_type="high_cpu",
                ec2_instance_id=instance_id,
                is_read=False,
            ).first()

            if existing_alert:
                self.stdout.write(
                    f"Existing unread alert for {instance_name}; skipping."
                )
                continue

            Alert.objects.create(
                title="High CPU Usage",
                message=(
                    f"EC2 instance {instance_name} is using "
                    f"{cpu_value:.2f}% CPU."
                ),
                alert_type="high_cpu",
                severity="critical",
                ec2_instance_id=instance_id,
                server_name=instance_name,
            )

            alerts_created += 1

            self.stdout.write(
                self.style.WARNING(
                    f"High CPU alert created for {instance_name}: "
                    f"{cpu_value:.2f}%"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"CPU check completed. Running instances checked: "
                f"{checked}. Alerts created: {alerts_created}."
            )
        )