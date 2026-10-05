from django.db import models


class Server(models.Model):
    STATUS_CHOICES = [
        ("running", "Running"),
        ("stopped", "Stopped"),
    ]

    name = models.CharField(
        max_length=100
    )

    ip_address = models.GenericIPAddressField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="stopped"
    )

    server_type = models.CharField(
        max_length=100
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class Deployment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("successful", "Successful"),
        ("failed", "Failed"),
    ]

    ec2_instance_id = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    server_name = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    application = models.CharField(
        max_length=100
    )

    version = models.CharField(
        max_length=50
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    logs = models.TextField(
        blank=True,
        default=""
    )

    def __str__(self):
        return f"{self.application} - {self.version}"
class Alert(models.Model):
    ALERT_TYPES = [
        ("high_cpu", "High CPU"),
        ("server_stopped", "Server Stopped"),
        ("deployment_failed", "Deployment Failed"),
        ("deployment_successful", "Deployment Successful"),
    ]

    SEVERITY_CHOICES = [
        ("info", "Info"),
        ("warning", "Warning"),
        ("critical", "Critical"),
    ]

    title = models.CharField(max_length=200)

    message = models.TextField()

    alert_type = models.CharField(
        max_length=50,
        choices=ALERT_TYPES
    )

    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default="info"
    )

    ec2_instance_id = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    server_name = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title