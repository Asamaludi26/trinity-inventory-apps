#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running database seeder..."
npx prisma db seed || echo "Seed skipped or already applied"

echo "Starting application..."
exec "$@"
