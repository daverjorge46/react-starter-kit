import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
import { redirect, useLoaderData } from "react-router";
import { AppSidebar } from "~/components/dashboard/app-sidebar";
import { SiteHeader } from "~/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { api } from "convex/_generated/api";
import type { Route } from "./+types/layout";
import { createClerkClient } from "@clerk/react-router/api.server";
import { Outlet } from "react-router";

export async function loader(args: Route.LoaderArgs) {
  try {
    const { userId, getToken } = await getAuth(args);

    // Redirect to sign-in if not authenticated
    if (!userId) {
      throw redirect("/sign-in");
    }

    // Debug logging as suggested by coach
    console.log("🔍 Auth Debug:", {
      userId: userId?.substring(0, 8) + "...",
      convexUrl: process.env.VITE_CONVEX_URL?.substring(0, 30) + "..."
    });

    // Create Convex client for server-side data fetching
    const convexClient = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
    
    // Get the JWT token for Convex authentication (template name should match Clerk dashboard)
    const token = await getToken({ template: "convex" });
    console.log("🔍 Token Debug:", {
      hasToken: !!token,
      tokenPreview: token?.substring(0, 20) + "..."
    });
    
    if (token) {
      convexClient.setAuth(token);
    }

    // Parallel data fetching to reduce waterfall
    const [subscriptionStatus, user] = await Promise.all([
      convexClient.query(api.subscriptions.checkUserSubscriptionStatus, {}),
      createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      }).users.getUser(userId)
    ]);

    // Redirect to subscription-required if no active subscription
    if (!subscriptionStatus?.hasActiveSubscription) {
      throw redirect("/subscription-required");
    }

    return { user };
  } catch (error) {
    // Handle auth errors more gracefully - don't log expected redirects
    if (error && typeof error === 'object' && 'status' in error) {
      const httpError = error as { status: number };
      if (httpError.status === 307) {
        // This is a Clerk handshake redirect, let it proceed
        throw error;
      }
      if (httpError.status === 302) {
        // This is expected redirect to sign-in, don't log as error
        throw redirect("/sign-in");
      }
    }
    
    // Only log unexpected errors
    console.error("Dashboard loader error:", error);
    
    // For other errors, redirect to sign-in
    throw redirect("/sign-in");
  }
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}