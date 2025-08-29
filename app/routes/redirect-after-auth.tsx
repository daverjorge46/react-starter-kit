import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import type { Route } from "./+types/redirect-after-auth";

export async function loader(args: Route.LoaderArgs) {
  try {
    const { userId, getToken } = await getAuth(args);

    // If not authenticated, redirect to sign-in
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

    // Check subscription status
    const subscriptionStatus = await convexClient.query(
      api.subscriptions.checkUserSubscriptionStatusByClerkId, 
      { clerkUserId: userId }
    );

    // Redirect based on subscription status
    if (subscriptionStatus?.hasActiveSubscription) {
      throw redirect("/dashboard");
    } else {
      throw redirect("/pricing");
    }
  } catch (error) {
    // Handle auth errors gracefully
    if (error && typeof error === 'object' && 'status' in error) {
      const httpError = error as { status: number };
      if (httpError.status === 302 || httpError.status === 307) {
        // Allow redirects to proceed
        throw error;
      }
    }
    
    // For other errors, redirect to sign-in
    throw redirect("/sign-in");
  }
}

// This component should never render as it always redirects
export default function RedirectAfterAuth() {
  return null;
}