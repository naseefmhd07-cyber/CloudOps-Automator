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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name