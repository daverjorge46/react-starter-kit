import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
import { json, redirect } from "react-router";
import { useLoaderData, Form } from "react-router";
import { api } from "convex/_generated/api";
import type { Route } from "./+types/test-subscription";

export async function loader(args: Route.LoaderArgs) {
  const { userId, getToken } = await getAuth(args);
  
  // Redirect to sign-in if not authenticated
  if (!userId) {
    throw redirect("/sign-in");
  }
  
  // Create Convex client for server-side data fetching
  const convexClient = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
  
  // Get the JWT token for Convex authentication
  const token = await getToken({ template: "convex" });
  
  if (token) {
    convexClient.setAuth(token);
  }

  try {
    // Query debug information and subscription status
    const [debugInfo, subscriptionStatus] = await Promise.all([
      convexClient.query(api.subscriptions.debugUserAndSubscriptions),
      convexClient.query(api.subscriptions.checkUserSubscriptionStatus, {})
    ]);
    
    return json({
      userId,
      hasToken: !!token,
      debugInfo,
      subscriptionStatus,
    });
  } catch (error) {
    return json({
      userId,
      hasToken: !!token,
      debugInfo: null,
      subscriptionStatus: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function action(args: Route.ActionArgs) {
  const { userId, getToken } = await getAuth(args);
  
  if (!userId) {
    throw redirect("/sign-in");
  }
  
  const convexClient = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
  const token = await getToken({ template: "convex" });
  
  if (token) {
    convexClient.setAuth(token);
  }

  try {
    const result = await convexClient.mutation(api.subscriptions.createTestSubscription);
    return json({ success: true, result });
  } catch (error) {
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export default function TestSubscriptionPage() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Test Subscription Management</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <p>User ID: {data.userId || 'Not authenticated'}</p>
          <p>Has Token: {data.hasToken ? 'Yes' : 'No'}</p>
        </div>
        
        {data.subscriptionStatus && (
          <div className={`border rounded-lg p-4 ${
            data.subscriptionStatus.hasActiveSubscription 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h2 className="text-lg font-semibold mb-2">Current Subscription Status</h2>
            <p className={`font-medium ${
              data.subscriptionStatus.hasActiveSubscription 
                ? 'text-green-700' 
                : 'text-red-700'
            }`}>
              {data.subscriptionStatus.hasActiveSubscription 
                ? '✅ Active Subscription Found' 
                : '❌ No Active Subscription'}
            </p>
          </div>
        )}
        
        {!data.subscriptionStatus?.hasActiveSubscription && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Create Test Subscription</h2>
            <p className="mb-4 text-sm text-gray-600">
              This will create a test subscription for the current user to test the dashboard flow.
            </p>
            <Form method="post">
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Test Subscription
              </button>
            </Form>
          </div>
        )}
        
        {data.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {data.error}
          </div>
        )}
        
        {data.debugInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Database Debug Info</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Current User:</strong> {data.debugInfo.currentUser ? 'Found' : 'Not found'}</p>
              <p><strong>Total Users:</strong> {data.debugInfo.allUsersCount}</p>
              <p><strong>Total Subscriptions:</strong> {data.debugInfo.allSubscriptionsCount}</p>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Full Debug Data</summary>
              <pre className="bg-white p-4 rounded mt-2 text-xs overflow-auto border">
                {JSON.stringify(data.debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}
        
        <div className="flex space-x-4">
          <a 
            href="/dashboard" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Test Dashboard Access
          </a>
          <a 
            href="/pricing" 
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Go to Pricing
          </a>
        </div>
      </div>
    </div>
  );
}