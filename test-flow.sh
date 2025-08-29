#!/bin/bash
# Remove set -e to allow continuing on errors for testing purposes

echo "=== Testing React Starter Kit Subscription Flow ==="
echo ""

# Check if the React Router dev server is running
echo "1. Checking if React Router dev server is running..."
if curl -s http://localhost:5174/ > /dev/null 2>&1; then
    echo "✅ React Router dev server is running on port 5174"
else
    echo "❌ React Router dev server is not responding on port 5174"
    echo "Please ensure you've started the development server with: npm run dev"
    exit 1
fi

# Check if Convex backend is running
echo ""
echo "2. Checking if Convex backend is running..."
if curl -s http://localhost:3210/api/status > /dev/null 2>&1; then
    echo "✅ Convex backend appears to be running"
else
    echo "⚠️  Convex backend may not be running or on different port"
    echo "Please ensure you've started Convex with: npx convex dev"
fi

echo ""
echo "3. Testing application endpoints..."

# Test homepage
echo "   Testing homepage..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/ | grep -q "200"; then
    echo "   ✅ Homepage loads successfully"
else
    echo "   ❌ Homepage failed to load"
fi

# Test pricing page
echo "   Testing pricing page..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/pricing | grep -q "200"; then
    echo "   ✅ Pricing page loads successfully"
else
    echo "   ❌ Pricing page failed to load"
fi

# Test debug page
echo "   Testing debug page..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/debug | grep -q "200\|302\|401"; then
    echo "   ✅ Debug page responds (may require authentication)"
else
    echo "   ❌ Debug page failed to respond"
fi

# Test test-subscription page
echo "   Testing test-subscription page..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/test-subscription | grep -q "200\|302\|401"; then
    echo "   ✅ Test subscription page responds (may require authentication)"
else
    echo "   ❌ Test subscription page failed to respond"
fi

echo ""
echo "=== Test Results Summary ==="
echo "✅ Application appears to be running"
echo "🔗 Homepage: http://localhost:5174/"
echo "🔗 Pricing: http://localhost:5174/pricing"
echo "🔗 Debug: http://localhost:5174/debug"
echo "🔗 Test Subscription: http://localhost:5174/test-subscription"
echo ""
echo "Next steps for manual testing:"
echo "1. Open http://localhost:5174/ in your browser"
echo "2. Sign in with Clerk authentication"
echo "3. Visit http://localhost:5174/test-subscription to create a test subscription"
echo "4. Try accessing http://localhost:5174/dashboard to verify the flow works"
echo ""