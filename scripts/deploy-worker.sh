#!/bin/bash

set -e

PROJECT_DIR="/home/ec2-user/CloudOps-Automator"
VENV="/home/ec2-user/cloudops-venv312"
DEPLOYMENT_ID="${DEPLOYMENT_ID:-}"
LOG_FILE="/tmp/cloudops-deployment-${DEPLOYMENT_ID}.log"

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "ERROR: DEPLOYMENT_ID is not set."
    exit 1
fi

: > "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================"
echo "CloudOps Automator Deployment Worker"
echo "Deployment ID: #$DEPLOYMENT_ID"
echo "Started: $(date)"
echo "========================================"

cd "$PROJECT_DIR/backend"

"$VENV/bin/python" manage.py shell -c "
from django.utils import timezone
from core.models import Deployment

d = Deployment.objects.get(pk=$DEPLOYMENT_ID)
d.status = 'running'
d.started_at = timezone.now()
d.logs = 'Deployment started...'
d.save(update_fields=['status', 'started_at', 'logs'])

print('Deployment #$DEPLOYMENT_ID marked as running.')
"

echo ""
echo "Starting deployment script..."
echo ""

if bash "$PROJECT_DIR/scripts/deploy.sh"; then

    echo ""
    echo "Deployment script completed successfully."
    echo ""

    "$VENV/bin/python" manage.py shell -c "
from django.utils import timezone
from core.models import Deployment

d = Deployment.objects.get(pk=$DEPLOYMENT_ID)

with open('$LOG_FILE', 'r') as f:
    deployment_logs = f.read()

d.status = 'successful'
d.completed_at = timezone.now()
d.logs = deployment_logs
d.save(update_fields=['status', 'completed_at', 'logs'])

print('Deployment #$DEPLOYMENT_ID marked as successful.')
"

    echo ""
    echo "========================================"
    echo "DEPLOYMENT WORKER COMPLETED SUCCESSFULLY"
    echo "Completed: $(date)"
    echo "========================================"

else

    echo ""
    echo "Deployment script FAILED."
    echo ""

    "$VENV/bin/python" manage.py shell -c "
from django.utils import timezone
from core.models import Deployment

d = Deployment.objects.get(pk=$DEPLOYMENT_ID)

with open('$LOG_FILE', 'r') as f:
    deployment_logs = f.read()

d.status = 'failed'
d.completed_at = timezone.now()
d.logs = deployment_logs
d.save(update_fields=['status', 'completed_at', 'logs'])

print('Deployment #$DEPLOYMENT_ID marked as failed.')
"

    echo ""
    echo "========================================"
    echo "DEPLOYMENT WORKER FAILED"
    echo "Completed: $(date)"
    echo "========================================"

    exit 1
fi

rm -f "$LOG_FILE"
