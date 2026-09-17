from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("health/", views.health_check, name="health_check"),
    path("dashboard/", views.dashboard, name="dashboard"),

    # Servers
    path("servers/", views.servers, name="servers"),
    path(
        "servers/<int:pk>/",
        views.server_detail,
        name="server_detail"
    ),

    # EC2 controls
    path(
        "servers/<str:instance_id>/start/",
        views.start_ec2,
        name="start_ec2"
    ),
    path(
        "servers/<str:instance_id>/stop/",
        views.stop_ec2,
        name="stop_ec2"
    ),

    # Deployments
    path(
        "deployments/",
        views.deployments,
        name="deployments"
    ),
    path(
        "deployments/<int:pk>/",
        views.deployment_detail,
        name="deployment_detail"
    ),

    # Authentication
    path(
        "auth/register/",
        views.register,
        name="register"
    ),
    path(
        "auth/login/",
        TokenObtainPairView.as_view(),
        name="login"
    ),
    path(
        "auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),
]
