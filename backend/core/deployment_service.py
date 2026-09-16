
import os
from django.utils import timezone


def run_deployment(deployment):
    """
    Runs the deployment process for a Deployment object.
    """

    try:
        deployment.status = "running"
        deployment.save(update_fields=["status"])

        print("Starting deployment...")
        print("Checking application directory...")

        application_directory = "/home/ec2-user/CloudOps-Automator"

        if not os.path.isdir(application_directory):
            raise FileNotFoundError(
                f"Application directory not found: {application_directory}"
            )

        print("Directory check successful.")
        print(f"Application directory: {application_directory}")

        deployment.status = "successful"
        deployment.completed_at = timezone.now()

        deployment.save(
            update_fields=[
                "status",
                "completed_at",
            ]
        )

        print("Deployment completed successfully.")

        return True

    except Exception as e:
        print("DEPLOYMENT ERROR:", repr(e))

        deployment.status = "failed"
        deployment.completed_at = timezone.now()

        deployment.save(
            update_fields=[
                "status",
                "completed_at",
            ]
        )

        return False
