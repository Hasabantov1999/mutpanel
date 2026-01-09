#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy --url "$DATABASE_URL"

echo "🌱 Running database seed (if needed)..."
npx prisma db seed || echo "Seed already applied or skipped"

echo "🚀 Starting Next.js application..."
exec node server.js
