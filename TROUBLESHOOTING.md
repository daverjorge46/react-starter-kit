# React Starter Kit - Troubleshooting Guide

This guide helps resolve common issues with subscription validation, environment configuration, and development server stability.

## Quick Fix Commands

```bash
# Complete Environment Setup (Run these in order)
chmod +x setup-convex-env.sh dev-startup.sh
./setup-convex-env.sh
./dev-startup.sh
```

## Issue 1: Users With Valid Subscriptions Can't Access Dashboard

### Symptoms
- Users are redirected to `/subscription-required` despite having active subscriptions
- Console shows "No user found with tokenIdentifier"
- Environment variable warnings in Convex logs

### Root Causes
1. **Environment Variables Not Set in Convex**: Convex functions don't automatically load `.env.local`
2. **Token Identifier Mismatch**: Clerk's `userId` format doesn't match stored `tokenIdentifier`
3. **Missing User Records**: User not created in Convex database during first login

### Solutions

#### 1. Fix Environment Variables
```bash
# Set environment variables in Convex deployment
npx convex env set CLERK_SECRET_KEY "sk_test_Ge8HhNkF82kV5jIGWZP7BTCHMa3QsGNTABy1hm884k"
npx convex env set CLERK_BILLING_SECRET_KEY "sk_test_Ge8HhNkF82kV5jIGWZP7BTCHMa3QsGNTABy1hm884k" 
npx convex env set CLERK_BILLING_WEBHOOK_SECRET "whsec_J43PocRx16wW2+fWc33OhKWKi4+RQ7N+"
npx convex env set OPENAI_API_KEY "your_openai_key_here"
npx convex env set FRONTEND_URL "http://localhost:5173"

# Verify variables are set
npx convex env list
```

#### 2. Debug User/Subscription Data
Access the debug query in your Convex dashboard or add this to your frontend:

```typescript
// Add to a React component to debug current state
const debug = useQuery(api.subscriptions.debugUserAndSubscriptions);
console.log("Debug data:", debug);
```

#### 3. Manual User Creation (if needed)
If users exist in Clerk but not Convex:

```typescript
// In your browser console on a signed-in page:
// This will trigger user creation in Convex
location.href = "/dashboard/settings"; // Any protected route
```

## Issue 2: Navigation Not Showing Subscription Features

### Symptoms
- Dashboard, AI Chat, and Settings buttons missing
- Navigation shows "Subscribe" instead of "Dashboard"
- User appears signed in but without subscription access

### Solution
The navigation is actually working correctly. The issue is that `hasActiveSubscription` is `false` due to the database lookup problems above. Fix the subscription validation first, and navigation will update automatically.

Navigation logic:
- **Not signed in**: Shows "Login" and "Sign Up" buttons
- **Signed in, no subscription**: Shows "Subscribe" button  
- **Signed in, with subscription**: Shows "Dashboard" button

## Issue 3: Development Server Crashes (Exit Code 137)

### Symptoms
- Dev server crashes with "exit code 137"
- Background processes fail to start
- Memory-related crashes

### Solutions

#### 1. Use the Startup Script
```bash
./dev-startup.sh
```

#### 2. Manual Startup (if script fails)
```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start React Router (wait for Convex to initialize)
npm run dev
```

#### 3. Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

#### 4. Port Conflicts
```bash
# Check for port conflicts
lsof -i :5173  # React Router
lsof -i :8080  # Convex typically uses this

# Kill conflicting processes
kill -9 <PID>
```

## Issue 4: Environment Variables Not Loading

### Symptoms
- Convex logs: "CLERK_BILLING_SECRET_KEY is not configured"  
- Variables exist in `.env.local` but aren't recognized
- API calls fail with authentication errors

### Root Cause
Convex runs in its own environment and doesn't load `.env.local` automatically.

### Solution
Environment variables must be set explicitly in the Convex deployment:

```bash
# Run the setup script
./setup-convex-env.sh

# Or set manually:
npx convex env set VARIABLE_NAME "value"
```

## Issue 5: Subscription Webhooks Not Working

### Symptoms  
- Subscriptions created in Clerk Billing but not reflected in dashboard
- Users can purchase but don't get access
- Webhook events not processed

### Solutions

#### 1. Verify Webhook Endpoint
- **Local**: `http://localhost:5173/webhook/clerk`
- **Production**: `https://yourapp.com/webhook/clerk`

#### 2. Check Webhook Secret
```bash
npx convex env get CLERK_BILLING_WEBHOOK_SECRET
# Should match the secret in Clerk dashboard
```

#### 3. Test Webhook Manually
```bash
curl -X POST http://localhost:5173/webhook/clerk \
  -H "Content-Type: application/json" \
  -d '{"type": "subscription.created", "data": {...}}'
```

## Development Workflow

### Recommended Startup Order
1. **Environment Setup**: Run `./setup-convex-env.sh`
2. **Start Services**: Run `./dev-startup.sh` 
3. **Verify Setup**: Check both servers are running
4. **Test Flow**: Sign up → Subscribe → Access dashboard

### Daily Development
```bash
# Quick start (if already set up)
./dev-startup.sh

# Or separate terminals
npx convex dev &
npm run dev
```

## Debugging Tools

### 1. Convex Dashboard
- Visit: https://dashboard.convex.dev
- Check logs, data, and function executions
- Monitor environment variables

### 2. Browser Console Debugging
```typescript
// Check loader data on any page
console.log("Loader data:", window.__REACT_ROUTER_DATA__);

// Debug subscription status
// (Add to any React component)
const subscriptionData = useQuery(api.subscriptions.checkUserSubscriptionStatus);
console.log("Subscription:", subscriptionData);
```

### 3. Network Debugging  
- Check Network tab for failed API calls
- Look for 401 (unauthorized) or 500 (server error) responses
- Verify Clerk and Convex API calls are succeeding

## Common Error Messages

### "CLERK_BILLING_SECRET_KEY is not configured"
**Fix**: Run `./setup-convex-env.sh`

### "No user found with tokenIdentifier"
**Fix**: The improved subscription validation handles multiple identifier formats. Restart Convex after updating the functions.

### "Authentication failed"  
**Fix**: Verify Clerk keys are correct and JWT template is set to "convex"

### "Webhook verification failed"
**Fix**: Ensure webhook secret matches between Clerk dashboard and Convex environment

## Environment File Reference

Your `.env.local` should contain:

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=dev:your-deployment-name
VITE_CONVEX_URL=https://your-convex-url.convex.cloud

# Clerk Authentication  
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Billing
CLERK_BILLING_SECRET_KEY=sk_test_...
CLERK_BILLING_PUBLISHABLE_KEY=pk_test_...
CLERK_BILLING_WEBHOOK_SECRET=whsec_...

# OpenAI (for AI chat)
OPENAI_API_KEY=sk-proj-...

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Need More Help?

1. **Check Convex Logs**: Visit the Convex dashboard for detailed error logs
2. **Enable Debug Mode**: The improved functions now include detailed console logging
3. **Verify Data**: Use the `debugUserAndSubscriptions` query to inspect current state
4. **Test Each Component**: Start with authentication, then subscription, then dashboard access

Remember: Most issues are resolved by properly setting environment variables in Convex and ensuring user records exist in the database.