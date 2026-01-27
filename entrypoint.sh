#!/bin/sh
set -e

echo "Starting Qdrant Web Backup..."
echo "Environment: SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-prod}"

# Create data directories if they don't exist
mkdir -p /app/data/snapshots

# Start supervisor (manages nginx + java backend)
exec supervisord -c /etc/supervisord.conf