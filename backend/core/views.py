from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Server
from .serializers import ServerSerializer, RegisterSerializer


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
def dashboard(request):
    total = Server.objects.count()
    running = Server.objects.filter(status="running").count()
    stopped = Server.objects.filter(status="stopped").count()

    return Response({
        "project": "CloudOps Automator",
        "servers": {
            "total": total,
            "running": running,
            "stopped": stopped
        },
        "deployments": {
            "successful": 5,
            "failed": 1
        },
        "system_status": "healthy"
    })


# =========================
# SERVERS - GET & POST
# =========================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def servers(request):

    # GET ALL SERVERS
    if request.method == "GET":
        server_list = Server.objects.all()
        serializer = ServerSerializer(server_list, many=True)

        return Response({
            "servers": serializer.data
        })

    # CREATE SERVER
    if request.method == "POST":
        serializer = ServerSerializer(data=request.data)

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
# GET / PUT / DELETE
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

    # GET SINGLE SERVER
    if request.method == "GET":
        serializer = ServerSerializer(server)

        return Response(serializer.data)

    # UPDATE SERVER
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

    # DELETE SERVER
    if request.method == "DELETE":
        server.delete()

        return Response({
            "message": "Server deleted successfully"
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