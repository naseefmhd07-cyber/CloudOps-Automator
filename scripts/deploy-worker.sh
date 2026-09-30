#!/bin/bash

set -e

PROJECT_DIR="/home/ec2-user/CloudOps-Automator"
VENV="/home/ec2-user/cloudops-venv312"
DEPLOYMENT_ID="${DEPLOYMENT_ID:-}"

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "ERROR: DEPLOYMENT_ID is not set."
    exit 1
fi

echo "Starting deployment worker for deployment #$DEPLOYMENT_ID"

cd "$PROJECT_DIR/backend"

"$VENV/bin/python" manage.py shell -c "
from core.models import Deployment
d = Deployment.objects.get(pk=$DEPLOYMENT_ID)
d.status = 'running'
d.save(update_fields=['status'])
print('Deployment #$DEPLOYMENT_ID marked as running.')
"

if bash "$PROJECT_DIR/scripts/deploy.sh"; then

    "$VENV/bin/python" manage.py shell -c "
from django.utils import timezone
from core.models import Deployment
d = Deployment.objects.get(pk=$DEPLOYMENT_ID)
d.status = 'successful'
d.completed_at = timezone.now()
d.save(update_fields=['status', 'completed_at'])
print('Deployment #$DEPLOYMENT_ID marked as successful.')
"

else

    "$VENV/bin/python" manage.py shell -c "
from django.utils import timezone
from core.models import Deployment
d = Deployment.objects.get(pk=$DEPLOYMENT_ID)
d.status = 'failed'
d.completed_at = timezone.now()
d.save(update_fields=['status', 'completed_at'])
print('Deployment #$DEPLOYMENT_ID marked as failed.')
"

    exit 1
fi
