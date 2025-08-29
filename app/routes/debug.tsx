import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
import { json } from "react-router";
import { useLoaderData } from "react-router";
import { api } from "convex/_generated/api";
import type { Route } from "./+types/debug";

export async function loader(args: Route.LoaderArgs) {
  const { userId, getToken } = await getAuth(args);
  
  // Create Convex client for server-side data fetching
  const convexClient = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
  
  // Get the JWT token for Convex authentication
  const token = await getToken({ template: "convex" });
  
  if (token) {
    convexClient.setAuth(token);
  }

  try {
    // Query debug information
    const debugInfo = await convexClient.query(api.subscriptions.debugUserAndSubscriptions);
    
    return json({
      userId,
      hasToken: !!token,
      debugInfo,
    });
  } catch (error) {
    return json({
      userId,
      hasToken: !!token,
      debugInfo: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default function DebugPage() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Authentication</h2>
          <p>User ID: {data.userId || 'Not authenticated'}</p>
          <p>Has Token: {data.hasToken ? 'Yes' : 'No'}</p>
        </div>
        
        {data.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {data.error}
          </div>
        )}
        
        {data.debugInfo && (
          <div>
            <h2 className="text-lg font-semibold">Database Debug Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(data.debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}