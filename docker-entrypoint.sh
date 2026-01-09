#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
sleep 5

echo "🚀 Starting Next.js application..."
exec node server.js
