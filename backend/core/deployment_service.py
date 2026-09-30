import subprocess

from .models import Deployment


DEPLOYMENT_SERVICE = "cloudops-deployment.service"


def run_deployment(deployment_id):
    """
    Start the deployment worker as an independent systemd service.
    The deployment runs outside the Gunicorn process.
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

        result = subprocess.run(
            [
                "sudo",
                "systemctl",
                "start",
                DEPLOYMENT_SERVICE,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            raise RuntimeError(
                "Failed to start deployment worker: "
                f"{result.stderr.strip()}"
            )

        print(
            f"Deployment worker started for #{deployment_id}."
        )

        return True

    except Deployment.DoesNotExist:
        print(
            f"Deployment #{deployment_id} does not exist."
        )
        return False

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
            deployment.save(
                update_fields=["status"]
            )

        except Deployment.DoesNotExist:
            pass

        return False
