import { getAuth } from "@clerk/react-router/ssr.server";
import { fetchAction, fetchQuery } from "convex/nextjs";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "../../convex/_generated/api";
import type { Route } from "./+types/pricing";

export async function loader(args: Route.LoaderArgs) {
  try {
    // Handle authentication more gracefully for pricing page
    let userId: string | null = null;
    let subscriptionData: any = null;
    
    try {
      const authResult = await getAuth(args);
      userId = authResult.userId;
    } catch (authError) {
      // Silently handle auth handshake - this is normal for unauthenticated users
      // Only log if it's an unexpected error (not a 307 redirect)
      if (authError && typeof authError === 'object' && 'status' in authError) {
        const httpError = authError as { status: number };
        if (httpError.status !== 307) {
          console.log("Unexpected auth error on pricing page:", authError);
        }
        // 307 redirects are normal auth handshake flow, don't log them
      }
      userId = null;
    }

    // Only fetch subscription data if user is authenticated
    if (userId) {
      try {
        subscriptionData = await fetchQuery(api.subscriptions.checkUserSubscriptionStatus, {
          userId,
        });
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
        subscriptionData = null;
      }
    }

    // Use static plans that match the working Clerk Billing plans
    // Since Clerk Billing is working (as shown in user screenshots), we'll provide
    // static plans that redirect to Clerk's billing system
    const staticPlans = {
      items: [
        {
          id: "plan_personal",
          name: "Personal Plan",
          description: "Perfect for individuals getting started",
          isRecurring: true,
          prices: [{
            id: "price_personal",
            amount: 500, // $5.00 in cents
            currency: "usd",
            interval: "month",
          }],
        },
        {
          id: "plan_business", 
          name: "Business Plan",
          description: "Ideal for growing businesses and teams",
          isRecurring: true,
          prices: [{
            id: "price_business",
            amount: 5000, // $50.00 in cents
            currency: "usd", 
            interval: "month",
          }],
        },
      ],
      pagination: { totalCount: 2, maxPage: 1 },
    };

    return {
      isSignedIn: !!userId,
      hasActiveSubscription: subscriptionData?.hasActiveSubscription || false,
      plans: staticPlans,
    };
  } catch (error) {
    console.error("Pricing loader error:", error);
    // Return safe defaults with static plans
    const staticPlans = {
      items: [
        {
          id: "plan_personal",
          name: "Personal Plan",
          description: "Perfect for individuals getting started",
          isRecurring: true,
          prices: [{
            id: "price_personal",
            amount: 500, // $5.00 in cents
            currency: "usd",
            interval: "month",
          }],
        },
        {
          id: "plan_business", 
          name: "Business Plan",
          description: "Ideal for growing businesses and teams",
          isRecurring: true,
          prices: [{
            id: "price_business",
            amount: 5000, // $50.00 in cents
            currency: "usd", 
            interval: "month",
          }],
        },
      ],
      pagination: { totalCount: 2, maxPage: 1 },
    };

    return {
      isSignedIn: false,
      hasActiveSubscription: false,
      plans: staticPlans,
    };
  }
}

export default function PricingPage({ loaderData }: Route.ComponentProps) {
  const { isAuthenticated } = useConvexAuth();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscriptionStatus = useQuery(
    api.subscriptions.checkUserSubscriptionStatus,
    {
      userId: isAuthenticated ? "" : undefined,
    }
  );
  const userSubscription = useQuery(api.subscriptions.fetchUserSubscription);
  const createCheckout = useAction(api.subscriptions.createCheckoutSession);
  const createPortalUrl = useAction(api.subscriptions.createCustomerPortalUrl);
  const upsertUser = useMutation(api.users.upsertUser);

  const handleSubscribe = async (priceId: string) => {
    if (!isAuthenticated) {
      // Redirect to sign in
      window.location.href = "/sign-in";
      return;
    }

    setLoadingPriceId(priceId);
    setError(null);

    try {
      // Ensure user exists in database before action
      await upsertUser();

      // Since Clerk Billing is working perfectly (as shown in screenshots),
      // redirect authenticated users to Clerk's billing interface
      // where they can manage subscriptions properly
      
      // For users with active subscriptions, redirect to Clerk's billing page
      if (userSubscription?.status === "active") {
        // Redirect to Clerk's user profile billing section
        window.location.href = "/dashboard/settings";
        setLoadingPriceId(null);
        return;
      }

      // Since Clerk Billing is working perfectly in the user account interface,
      // direct users to the account billing section where they can subscribe
      console.log("Directing user to Clerk billing interface");
      
      // Show user a message and redirect to account billing
      setError("Taking you to your account where you can complete your subscription...");
      
      setTimeout(() => {
        // Create a Clerk account modal or redirect to account management
        // This will open Clerk's user account interface where billing works
        if (window.Clerk && window.Clerk.openUserProfile) {
          window.Clerk.openUserProfile({ 
            initialPage: "billing" 
          });
        } else {
          // Fallback: redirect to a page that will show account interface
          window.location.href = "/dashboard/settings";
        }
        setLoadingPriceId(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to process subscription action:", error);
      
      // Fallback: since Clerk Billing works, redirect to sign-in then dashboard
      const errorMessage = "Please sign in to access billing. Redirecting to dashboard where billing is available.";
      setError(errorMessage);
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
      
      setLoadingPriceId(null);
    }
  };

  if (!loaderData.plans || loaderData.plans.items.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading plans...</span>
        </div>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground">
          Choose the plan that fits your needs
        </p>
        {isAuthenticated && !subscriptionStatus?.hasActiveSubscription && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
            <p className="text-blue-800 font-medium">📋 Complete your setup</p>
            <p className="text-blue-700 text-sm mt-1">
              You're signed in! Choose a plan below to access your dashboard and
              start using all features.
            </p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
        {loaderData.plans.items
          .sort((a: any, b: any) => {
            const priceComparison = a.prices[0].amount - b.prices[0].amount;
            return priceComparison !== 0
              ? priceComparison
              : a.name.localeCompare(b.name);
          })
          .map((plan: any, index: number) => {
            const isPopular =
              loaderData.plans.items.length === 2
                ? index === 1
                : index === Math.floor(loaderData.plans.items.length / 2); // Mark middle/higher priced plan as popular
            const price = plan.prices[0]; // Use first price for display
            // More robust current plan detection - prioritize amount matching due to price ID inconsistencies
            const isCurrentPlan =
              userSubscription?.status === "active" &&
              userSubscription?.amount === price.amount;

            return (
              <Card
                key={plan.id}
                className={`relative h-fit ${
                  isPopular ? "border-primary" : ""
                } ${isCurrentPlan ? "border-green-500 bg-green-50/50" : ""}`}
              >
                {isPopular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${(price.amount / 100).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground">
                      /{price.interval || "month"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>All features included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Cancel anytime</span>
                  </div>
                  {plan.isRecurring && (
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>Recurring billing</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(price.id)}
                    disabled={loadingPriceId === price.id}
                    variant={isCurrentPlan ? "secondary" : "default"}
                  >
                    {loadingPriceId === price.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up checkout...
                      </>
                    ) : isCurrentPlan ? (
                      "✓ Current Plan"
                    ) : userSubscription?.status === "active" ? (
                      (() => {
                        const currentAmount = userSubscription.amount || 0;
                        const newAmount = price.amount;

                        if (newAmount > currentAmount) {
                          return `Upgrade (+$${(
                            (newAmount - currentAmount) /
                            100
                          ).toFixed(0)}/mo)`;
                        } else if (newAmount < currentAmount) {
                          return `Downgrade (-$${(
                            (currentAmount - newAmount) /
                            100
                          ).toFixed(0)}/mo)`;
                        } else {
                          return "Manage Plan";
                        }
                      })()
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Need a custom plan?{" "}
          <span className="text-primary cursor-pointer hover:underline">
            Contact us
          </span>
        </p>
        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {userSubscription &&
          !loaderData.plans?.items.some(
            (plan: any) => plan.prices[0].id === userSubscription.clerkPriceId
          ) && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md max-w-md mx-auto">
              <p className="text-amber-800 text-center text-sm">
                You have an active subscription that's not shown above. Contact
                support for assistance.
              </p>
            </div>
          )}
      </div>
    </section>
  );
}
