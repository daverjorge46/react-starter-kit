#!/bin/bash

# Development Environment Startup Script
# This script ensures proper setup and startup of the React Starter Kit

set -e  # Exit on error

echo "🚀 Starting React Starter Kit Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found. Please copy from .env.example and configure."
    exit 1
fi

echo "📦 Installing dependencies if needed..."
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🔧 Setting up Convex environment variables..."
# Make the setup script executable and run it
chmod +x setup-convex-env.sh
./setup-convex-env.sh

echo "⚡ Starting development servers..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Stopping development servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit
}
trap cleanup EXIT INT TERM

# Start Convex dev server in background
echo "🔄 Starting Convex development server..."
npx convex dev &
CONVEX_PID=$!

# Wait a moment for Convex to initialize
sleep 3

# Start React Router dev server
echo "🌐 Starting React Router development server..."
npm run dev &
REACT_PID=$!

echo "✅ Development servers started!"
echo "🌐 React Router: http://localhost:5173"
echo "⚡ Convex Dashboard: https://dashboard.convex.dev"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for background processes
wait