#!/bin/bash

# Setup Convex Environment Variables
# This script sets the required environment variables in the Convex deployment

echo "🔧 Setting up Convex environment variables..."

# Check if we're in the right directory
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found. Please run this script from the project root."
    exit 1
fi

# Source the .env.local file to get the variables
if [ -f .env.local ]; then
    # Extract variables without the export command
    CLERK_SECRET_KEY=$(grep "^CLERK_SECRET_KEY=" .env.local | cut -d '=' -f2)
    CLERK_BILLING_SECRET_KEY=$(grep "^CLERK_BILLING_SECRET_KEY=" .env.local | cut -d '=' -f2)
    CLERK_BILLING_WEBHOOK_SECRET=$(grep "^CLERK_BILLING_WEBHOOK_SECRET=" .env.local | cut -d '=' -f2)
    OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" .env.local | cut -d '=' -f2)
    FRONTEND_URL=$(grep "^FRONTEND_URL=" .env.local | cut -d '=' -f2)
fi

echo "📝 Setting environment variables in Convex deployment..."

# Set each variable in Convex
npx convex env set CLERK_SECRET_KEY "$CLERK_SECRET_KEY"
npx convex env set CLERK_BILLING_SECRET_KEY "$CLERK_BILLING_SECRET_KEY" 
npx convex env set CLERK_BILLING_WEBHOOK_SECRET "$CLERK_BILLING_WEBHOOK_SECRET"
npx convex env set OPENAI_API_KEY "$OPENAI_API_KEY"
npx convex env set FRONTEND_URL "$FRONTEND_URL"

echo "✅ Convex environment variables configured!"
echo "🔄 Please restart your Convex dev server with: npx convex dev"

# List all set variables (without showing values for security)
echo "📋 Configured variables:"
npx convex env list