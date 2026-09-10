from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Server


# =========================
# SERVER SERIALIZER
# =========================

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


# =========================
# USER REGISTRATION SERIALIZER
# =========================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    password2 = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
            "password2",
        ]

    def validate(self, data):

        if data["password"] != data["password2"]:
            raise serializers.ValidationError({
                "password": "Passwords do not match."
            })

        return data

    def create(self, validated_data):

        validated_data.pop("password2")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )

        return user