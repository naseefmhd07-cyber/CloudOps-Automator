from django.db import models


class Server(models.Model):
    STATUS_CHOICES = [
        ("running", "Running"),
        ("stopped", "Stopped"),
    ]

    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="stopped"
    )

    server_type = models.CharField(max_length=100)

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

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.application} - {self.version}"
