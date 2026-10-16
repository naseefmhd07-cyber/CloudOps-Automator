from unittest.mock import patch
from .models import Server, Alert, Deployment
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
from .models import Server, Alert
from .models import Server


class HealthCheckTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_returns_200(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_health_check_identifies_project(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.data["project"], "CloudOps Automator")
        self.assertEqual(response.data["status"], "healthy")


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_dashboard_requires_authentication(self):
        response = self.client.get("/api/dashboard/")
        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_servers_requires_authentication(self):
        response = self.client.get("/api/servers/")
        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


class ServerAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="cloudops_test_user",
            password="TestPassword123!",
        )
        token = AccessToken.for_user(self.user)
        self.client = APIClient()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def test_create_server(self):
        payload = {
            "name": "Test Web Server",
            "status": "running",
            "ip_address": "192.168.10.10",
            "server_type": "Web",
        }

        response = self.client.post(
            "/api/servers/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Server.objects.count(), 1)
        self.assertEqual(
            Server.objects.get().name,
            "Test Web Server",
        )

    def test_invalid_server_ip_is_rejected(self):
        payload = {
            "name": "Invalid Server",
            "status": "running",
            "ip_address": "not-an-ip",
            "server_type": "Web",
        }

        response = self.client.post(
            "/api/servers/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Server.objects.count(), 0)

class AlertAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="alert_test_user",
            password="TestPassword123!",
        )
        token = AccessToken.for_user(self.user)
        self.client = APIClient()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def test_list_alerts_and_unread_count(self):
        Alert.objects.create(
            title="High CPU",
            message="CPU usage is above threshold",
            alert_type="high_cpu",
            severity="warning",
        )
        Alert.objects.create(
            title="Server stopped",
            message="The server is stopped",
            alert_type="server_stopped",
            severity="critical",
            is_read=True,
        )

        response = self.client.get("/api/alerts/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["alerts"]), 2)
        self.assertEqual(response.data["unread_count"], 1)

    def test_mark_alert_as_read(self):
        alert = Alert.objects.create(
            title="Deployment failed",
            message="Deployment did not complete",
            alert_type="deployment_failed",
            severity="critical",
        )

        response = self.client.patch(
            f"/api/alerts/{alert.id}/read/"
        )

        self.assertEqual(response.status_code, 200)
        alert.refresh_from_db()
        self.assertTrue(alert.is_read)

    def test_mark_missing_alert_returns_404(self):
        response = self.client.patch("/api/alerts/999999/read/")

        self.assertEqual(response.status_code, 404)

    def test_alerts_require_authentication(self):
        self.client.credentials()

        response = self.client.get("/api/alerts/")

        self.assertEqual(response.status_code, 401)

class DeploymentAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="deployment_test_user",
            password="TestPassword123!",
        )
        token = AccessToken.for_user(self.user)
        self.client = APIClient()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def test_list_deployments(self):
        Deployment.objects.create(
            application="Test Application",
            version="1.0",
        )

        response = self.client.get("/api/deployments/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["deployments"]), 1)

    @patch("core.views.run_deployment")
    def test_create_deployment_without_running_real_job(
        self, mock_run_deployment
    ):
        payload = {
            "application": "Test Application",
            "version": "1.0",
        }

        response = self.client.post(
            "/api/deployments/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.data["deployment"]["status"],
            "pending",
        )
        self.assertEqual(Deployment.objects.count(), 1)
        mock_run_deployment.assert_called_once_with(
            response.data["deployment"]["id"]
        )

    @patch("core.views.run_deployment")
    def test_invalid_deployment_is_rejected(
        self, mock_run_deployment
    ):
        payload = {
            "application": "Test Application",
        }

        response = self.client.post(
            "/api/deployments/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Deployment.objects.count(), 0)
        mock_run_deployment.assert_not_called()

    def test_deployments_require_authentication(self):
        self.client.credentials()

        response = self.client.get("/api/deployments/")

        self.assertEqual(response.status_code, 401)


class CloudWatchAlertProcessingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="cloudwatch_test_user",
            password="TestPassword123!",
        )
        token = AccessToken.for_user(self.user)
        self.client = APIClient()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    @patch("core.views.process_sqs_messages")
    def test_process_cloudwatch_alerts_success(
        self, mock_process_sqs
    ):
        mock_process_sqs.return_value = {
            "processed": 2,
            "failed": 0,
        }

        response = self.client.post(
            "/api/alerts/process-cloudwatch/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["processed"], 2)
        mock_process_sqs.assert_called_once_with(max_messages=5)

    @patch("core.views.process_sqs_messages")
    def test_process_cloudwatch_alerts_handles_error(
        self, mock_process_sqs
    ):
        mock_process_sqs.side_effect = Exception(
            "Simulated SQS failure"
        )

        response = self.client.post(
            "/api/alerts/process-cloudwatch/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 500)
        self.assertFalse(response.data["success"])
        self.assertEqual(
            response.data["error"],
            "Simulated SQS failure",
        )
        mock_process_sqs.assert_called_once_with(max_messages=5)

    def test_process_cloudwatch_alerts_requires_authentication(self):
        self.client.credentials()

        response = self.client.post(
            "/api/alerts/process-cloudwatch/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

class CPUAlertTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="cpu_alert_test_user",
            password="TestPassword123!",
        )
        token = AccessToken.for_user(self.user)
        self.client = APIClient()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    @patch("core.views.get_ec2_instances")
    @patch("core.views.check_high_cpu")
    def test_high_cpu_creates_alert(
        self, mock_check_cpu, mock_get_instances
    ):
        mock_check_cpu.return_value = 92.5
        mock_get_instances.return_value = [
            {"id": "i-test123", "name": "Test EC2 Server"}
        ]

        response = self.client.post(
            "/api/monitoring/i-test123/check-cpu/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["alert_created"])
        self.assertEqual(response.data["cpu"], 92.5)
        self.assertEqual(Alert.objects.count(), 1)
        alert = Alert.objects.get()
        self.assertEqual(alert.alert_type, "high_cpu")
        self.assertEqual(alert.ec2_instance_id, "i-test123")
        self.assertEqual(alert.server_name, "Test EC2 Server")
        mock_check_cpu.assert_called_once_with(
            "i-test123", threshold=80
        )
        mock_get_instances.assert_called_once()

    @patch("core.views.get_ec2_instances")
    @patch("core.views.check_high_cpu")
    def test_no_alert_when_cpu_metric_is_unavailable(
        self, mock_check_cpu, mock_get_instances
    ):
        mock_check_cpu.return_value = None

        response = self.client.post(
            "/api/monitoring/i-test123/check-cpu/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["alert_created"])
        self.assertEqual(Alert.objects.count(), 0)
        mock_get_instances.assert_not_called()

    @patch("core.views.get_ec2_instances")
    @patch("core.views.check_high_cpu")
    def test_duplicate_unread_cpu_alert_is_not_created(
        self, mock_check_cpu, mock_get_instances
    ):
        Alert.objects.create(
            title="High CPU Usage",
            message="Existing alert",
            alert_type="high_cpu",
            severity="critical",
            ec2_instance_id="i-test123",
            server_name="Test EC2 Server",
        )
        mock_check_cpu.return_value = 95.0
        mock_get_instances.return_value = [
            {"id": "i-test123", "name": "Test EC2 Server"}
        ]

        response = self.client.post(
            "/api/monitoring/i-test123/check-cpu/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["alert_created"])
        self.assertEqual(Alert.objects.count(), 1)

    def test_cpu_alert_requires_authentication(self):
        self.client.credentials()

        response = self.client.post(
            "/api/monitoring/i-test123/check-cpu/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 401)


class SQSAlertProcessorTests(TestCase):
    @patch("core.sqs_service.boto3.client")
    def test_sns_cloudwatch_alarm_creates_alert(self, mock_boto_client):
        from core.sqs_service import process_sqs_messages
        import json

        mock_sqs = mock_boto_client.return_value
        alarm = {
            "AlarmName": "Test-CPU-Alarm",
            "NewStateValue": "ALARM",
            "NewStateReason": "CPU exceeded 80 percent",
            "Trigger": {
                "Dimensions": [
                    {"Name": "InstanceId", "Value": "i-test123"}
                ]
            },
        }
        mock_sqs.receive_message.return_value = {
            "Messages": [
                {
                    "Body": json.dumps({
                        "Type": "Notification",
                        "Message": json.dumps(alarm),
                    }),
                    "ReceiptHandle": "test-receipt",
                }
            ]
        }

        result = process_sqs_messages()

        self.assertEqual(result["processed"], 1)
        self.assertTrue(
            Alert.objects.filter(
                title="Test-CPU-Alarm",
                alert_type="high_cpu",
                ec2_instance_id="i-test123",
                severity="critical",
            ).exists()
        )
        mock_sqs.delete_message.assert_called_once()

    @patch("core.sqs_service.boto3.client")
    def test_non_alarm_notification_is_ignored(self, mock_boto_client):
        from core.sqs_service import process_sqs_messages
        import json

        mock_sqs = mock_boto_client.return_value
        mock_sqs.receive_message.return_value = {
            "Messages": [
                {
                    "Body": json.dumps({
                        "AlarmName": "Test-CPU-Alarm",
                        "NewStateValue": "OK",
                    }),
                    "ReceiptHandle": "test-receipt",
                }
            ]
        }

        result = process_sqs_messages()

        self.assertEqual(result["processed"], 1)
        self.assertEqual(Alert.objects.count(), 0)
        mock_sqs.delete_message.assert_called_once()

    @patch("core.sqs_service.boto3.client")
    def test_existing_unread_alarm_is_not_duplicated(self, mock_boto_client):
        from core.sqs_service import process_sqs_messages
        import json

        Alert.objects.create(
            title="Test-CPU-Alarm",
            message="Existing alert",
            alert_type="high_cpu",
            severity="critical",
            ec2_instance_id="i-test123",
            server_name="Test EC2 Server",
        )

        mock_sqs = mock_boto_client.return_value
        alarm = {
            "AlarmName": "Test-CPU-Alarm",
            "NewStateValue": "ALARM",
            "NewStateReason": "CPU exceeded 80 percent",
            "Trigger": {
                "Dimensions": [
                    {"Name": "InstanceId", "Value": "i-test123"}
                ]
            },
        }
        mock_sqs.receive_message.return_value = {
            "Messages": [
                {
                    "Body": json.dumps(alarm),
                    "ReceiptHandle": "test-receipt",
                }
            ]
        }

        result = process_sqs_messages()

        self.assertEqual(result["processed"], 1)
        self.assertEqual(Alert.objects.count(), 1)
        mock_sqs.delete_message.assert_called_once()

    @patch("core.sqs_service.transaction.atomic")
    @patch("core.sqs_service.boto3.client")
    def test_database_failure_does_not_delete_message(
        self, mock_boto_client, mock_atomic
    ):
        import json
        from core.sqs_service import process_sqs_messages

        mock_sqs = mock_boto_client.return_value
        alarm = {
            "AlarmName": "Test-CPU-Alarm",
            "NewStateValue": "ALARM",
            "NewStateReason": "Test failure",
            "Trigger": {
                "Dimensions": [
                    {"Name": "InstanceId", "Value": "i-test123"}
                ]
            },
        }
        mock_sqs.receive_message.return_value = {
            "Messages": [
                {
                    "Body": json.dumps(alarm),
                    "ReceiptHandle": "test-receipt",
                }
            ]
        }
        mock_atomic.side_effect = RuntimeError("Simulated database failure")

        with self.assertRaisesRegex(RuntimeError, "Simulated database failure"):
            process_sqs_messages()

        mock_sqs.delete_message.assert_not_called()

    @patch("core.sqs_service.boto3.client")
    def test_malformed_notification_is_not_deleted(self, mock_boto_client):
        import json
        from core.sqs_service import process_sqs_messages

        mock_sqs = mock_boto_client.return_value
        mock_sqs.receive_message.return_value = {
            "Messages": [
                {
                    "Body": json.dumps({
                        "AlarmName": "Test-CPU-Alarm"
                    }),
                    "ReceiptHandle": "malformed-receipt",
                }
            ]
        }

        with self.assertRaisesRegex(
            ValueError, "Invalid CloudWatch alarm notification"
        ):
            process_sqs_messages()

        mock_sqs.delete_message.assert_not_called()
