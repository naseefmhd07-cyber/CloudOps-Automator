from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Server, Deployment
from .serializers import (
    ServerSerializer,
    DeploymentSerializer,
    RegisterSerializer,
)
from .aws_service import (
    get_ec2_instances,
    start_ec2_instance,
    stop_ec2_instance,
)
from .deployment_service import run_deployment


# =========================
# HEALTH CHECK
# =========================

@api_view(["GET"])
def health_check(request):
    return Response({
        "status": "healthy",
        "project": "CloudOps Automator",
        "version": "1.0"
    })


# =========================
# DASHBOARD
# =========================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):

    total = Server.objects.count()
    running = Server.objects.filter(
        status="running"
    ).count()

    stopped = Server.objects.filter(
        status="stopped"
    ).count()

    successful = Deployment.objects.filter(
        status="successful"
    ).count()

    failed = Deployment.objects.filter(
        status="failed"
    ).count()

    return Response({
        "project": "CloudOps Automator",
        "servers": {
            "total": total,
            "running": running,
            "stopped": stopped
        },
        "deployments": {
            "successful": successful,
            "failed": failed
        },
        "system_status": "healthy"
    })


# =========================
# SERVERS - GET & POST
# =========================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def servers(request):

    if request.method == "GET":

        # Try to get live EC2 instances
        try:
            ec2_instances = get_ec2_instances()

            server_list = []

            for instance in ec2_instances:

                state = instance["state"]

                if state == "running":
                    server_status = "running"
                else:
                    server_status = "stopped"

                server_list.append({
                    "id": instance["id"],
                    "name": instance["name"],
                    "status": server_status,
                    "state": state,
                    "ip_address": instance["public_ip"],
                    "public_ip": instance["public_ip"],
                    "private_ip": instance["private_ip"],
                    "server_type": instance["type"],
                    "type": instance["type"],
                    "created_at": None,
                })

            return Response({
                "servers": server_list
            })

        except Exception as e:

            return Response({
                "error": "Unable to fetch EC2 instances",
                "details": str(e)
            }, status=500)

    if request.method == "POST":

        serializer = ServerSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response({
                "message": "Server created successfully",
                "server": serializer.data
            }, status=201)

        return Response(
            serializer.errors,
            status=400
        )


# =========================
# SERVER DETAIL
# =========================

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def server_detail(request, pk):

    try:
        server = Server.objects.get(pk=pk)

    except Server.DoesNotExist:

        return Response({
            "error": "Server not found"
        }, status=404)

    if request.method == "GET":

        serializer = ServerSerializer(server)

        return Response(serializer.data)

    if request.method == "PUT":

        serializer = ServerSerializer(
            server,
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response({
                "message": "Server updated successfully",
                "server": serializer.data
            })

        return Response(
            serializer.errors,
            status=400
        )

    if request.method == "DELETE":

        server.delete()

        return Response({
            "message": "Server deleted successfully"
        })


# =========================
# START EC2 INSTANCE
# =========================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_ec2(request, instance_id):

    try:

        result = start_ec2_instance(
            instance_id
        )

        return Response({
            "message": "EC2 instance start requested",
            "instance": result
        })

    except Exception as e:

        return Response({
            "error": str(e)
        }, status=500)


# =========================
# STOP EC2 INSTANCE
# =========================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_ec2(request, instance_id):

    try:

        result = stop_ec2_instance(
            instance_id
        )

        return Response({
            "message": "EC2 instance stop requested",
            "instance": result
        })

    except Exception as e:

        return Response({
            "error": str(e)
        }, status=500)


# =========================
# DEPLOYMENTS
# =========================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def deployments(request):

    if request.method == "GET":

        deployment_list = Deployment.objects.order_by(
            "-created_at"
        )

        serializer = DeploymentSerializer(
            deployment_list,
            many=True
        )

        return Response({
            "deployments": serializer.data
        })

    if request.method == "POST":

        serializer = DeploymentSerializer(
            data=request.data
        )

        if serializer.is_valid():

            deployment = serializer.save(
                status="pending"
            )

            run_deployment(deployment)

            deployment.refresh_from_db()

            return Response({
                "message": "Deployment created successfully",
                "deployment": DeploymentSerializer(
                    deployment
                ).data,
            }, status=201)

        return Response(
            serializer.errors,
            status=400
        )


# =========================
# DEPLOYMENT DETAIL
# =========================

@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def deployment_detail(request, pk):

    try:

        deployment = Deployment.objects.get(
            pk=pk
        )

    except Deployment.DoesNotExist:

        return Response({
            "error": "Deployment not found"
        }, status=404)

    if request.method == "GET":

        serializer = DeploymentSerializer(
            deployment
        )

        return Response(
            serializer.data
        )

    if request.method == "DELETE":

        deployment.delete()

        return Response({
            "message": "Deployment deleted successfully"
        })


# =========================
# USER REGISTRATION
# =========================

@api_view(["POST"])
def register(request):

    serializer = RegisterSerializer(
        data=request.data
    )

    if serializer.is_valid():

        user = serializer.save()

        return Response({
            "message": "User registered successfully",
            "username": user.username
        }, status=201)

    return Response(
        serializer.errors,
        status=400
    )
