from django.urls import path
from . import views

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [

    # =========================
    # HEALTH CHECK
    # =========================

    path(
        "health/",
        views.health_check,
        name="health_check"
    ),

    # =========================
    # DASHBOARD
    # =========================

    path(
        "dashboard/",
        views.dashboard,
        name="dashboard"
    ),

    # =========================
    # SERVERS
    # =========================

    path(
        "servers/",
        views.servers,
        name="servers"
    ),

    path(
        "servers/<int:pk>/",
        views.server_detail,
        name="server_detail"
    ),

    # =========================
    # EC2 CONTROLS
    # =========================

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

    # =========================
    # EC2 MONITORING
    # =========================

    path(
        "monitoring/<str:instance_id>/",
        views.ec2_monitoring,
        name="ec2_monitoring"
    ),
    path(
    "monitoring/<str:instance_id>/check-cpu/",
    views.check_cpu_alert,
    name="check_cpu_alert",
),

    # =========================
    # DEPLOYMENTS
    # =========================

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

    # =========================
    # ALERTS
    # =========================

    path(
        "alerts/",
        views.alerts,
        name="alerts"
    ),

    path(
        "alerts/<int:pk>/read/",
        views.mark_alert_read,
        name="mark_alert_read"
    ),

    # =========================
    # AUTHENTICATION
    # =========================

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