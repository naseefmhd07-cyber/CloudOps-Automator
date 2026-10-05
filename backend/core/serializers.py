from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Server, Deployment, Alert


class ServerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Server

        fields = [
            "id",
            "name",
            "status",
            "ip_address",
            "server_type",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class DeploymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Deployment

        fields = [
            "id",
            "ec2_instance_id",
            "server_name",
            "application",
            "version",
            "status",
            "started_at",
            "created_at",
            "completed_at",
            "logs",
        ]

        read_only_fields = [
            "id",
            "status",
            "started_at",
            "created_at",
            "completed_at",
            "logs",
        ]


class AlertSerializer(serializers.ModelSerializer):

    class Meta:
        model = Alert

        fields = [
            "id",
            "title",
            "message",
            "alert_type",
            "severity",
            "ec2_instance_id",
            "server_name",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:
        model = User

        fields = [
            "username",
            "password",
            "email",
        ]

    def create(self, validated_data):

        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data.get("email", "")
        )

        return user