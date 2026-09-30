import os
import subprocess

from django.utils import timezone

from .models import Deployment


PROJECT_DIR = "/home/ec2-user/CloudOps-Automator"
DEPLOY_SCRIPT = os.path.join(
    PROJECT_DIR,
    "scripts",
    "deploy.sh",
)


def run_deployment(deployment_id):
    """
    Run the real deployment script for a Deployment object.

    This function is intended to run in a background process,
    not directly inside the API request.
    """

    try:
        deployment = Deployment.objects.get(
            pk=deployment_id
        )

        deployment.status = "running"
        deployment.save(
            update_fields=["status"]
        )

        print(
            f"Starting deployment #{deployment_id}..."
        )

        if not os.path.isdir(PROJECT_DIR):
            raise FileNotFoundError(
                f"Project directory not found: {PROJECT_DIR}"
            )

        if not os.path.isfile(DEPLOY_SCRIPT):
            raise FileNotFoundError(
                f"Deployment script not found: {DEPLOY_SCRIPT}"
            )

        print(
            f"Running deployment script: {DEPLOY_SCRIPT}"
        )

        result = subprocess.run(
            ["bash", DEPLOY_SCRIPT],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=1800,
        )

        print("========== DEPLOYMENT OUTPUT ==========")
        print(result.stdout)

        if result.stderr:
            print("========== DEPLOYMENT ERRORS ==========")
            print(result.stderr)

        if result.returncode != 0:
            raise RuntimeError(
                "Deployment script failed "
                f"with exit code {result.returncode}"
            )

        deployment.status = "successful"
        deployment.completed_at = timezone.now()

        deployment.save(
            update_fields=[
                "status",
                "completed_at",
            ]
        )

        print(
            f"Deployment #{deployment_id} completed successfully."
        )

        return True

    except Exception as e:

        print(
            "DEPLOYMENT ERROR:",
            repr(e)
        )

        try:
            deployment = Deployment.objects.get(
                pk=deployment_id
            )

            deployment.status = "failed"
            deployment.completed_at = timezone.now()

            deployment.save(
                update_fields=[
                    "status",
                    "completed_at",
                ]
            )

        except Deployment.DoesNotExist:
            print(
                f"Deployment #{deployment_id} no longer exists."
            )

        return False