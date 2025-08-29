import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, httpAction, mutation, query } from "./_generated/server";

// Clerk Billing API types
interface ClerkBillingProduct {
  id: string;
  name: string;
  description?: string;
  prices: ClerkBillingPrice[];
}

interface ClerkBillingPrice {
  id: string;
  amount: number;
  currency: string;
  interval?: 'month' | 'year';
  product_id: string;
}

interface ClerkCheckoutSession {
  id: string;
  url: string;
  success_url?: string;
  cancel_url?: string;
}

const createCheckout = async ({
  customerEmail,
  priceId,
  successUrl,
  metadata,
}: {
  customerEmail: string;
  priceId: string;
  successUrl: string;
  metadata?: Record<string, string>;
}) => {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }
  
  try {
    const checkoutData = {
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      customer_email: customerEmail,
      metadata: {
        ...metadata,
        priceId: priceId,
      },
    };

    const response = await fetch('https://api.clerk.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Clerk Billing API error: ${response.status} ${error}`);
    }

    const result: ClerkCheckoutSession = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

export const getAvailablePlansQuery = query({
  handler: async (ctx) => {
    if (!process.env.CLERK_SECRET_KEY) {
      return {
        items: [],
        pagination: { totalCount: 0, maxPage: 1 },
      };
    }

    try {
      const response = await fetch('https://api.clerk.com/v1/products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const products: ClerkBillingProduct[] = await response.json();

      const cleanedItems = products.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        isRecurring: true,
        prices: item.prices.map((price) => ({
          id: price.id,
          amount: price.amount,
          currency: price.currency,
          interval: price.interval,
        })),
      }));

      return {
        items: cleanedItems,
        pagination: { totalCount: products.length, maxPage: 1 },
      };
    } catch (error) {
      return {
        items: [],
        pagination: { totalCount: 0, maxPage: 1 },
      };
    }
  },
});

export const getAvailablePlans = action({
  handler: async (ctx) => {
    if (!process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY === 'your_clerk_secret_key_here') {
      return {
        items: [],
        pagination: { totalCount: 0, maxPage: 1 },
      };
    }

    try {
      const response = await fetch('https://api.clerk.com/v1/products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const products: ClerkBillingProduct[] = await response.json();

      const cleanedItems = products.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        isRecurring: true,
        prices: item.prices.map((price) => ({
          id: price.id,
          amount: price.amount,
          currency: price.currency,
          interval: price.interval,
        })),
      }));

      return {
        items: cleanedItems,
        pagination: { totalCount: products.length, maxPage: 1 },
      };
    } catch (error) {
      return {
        items: [],
        pagination: { totalCount: 0, maxPage: 1 },
      };
    }
  },
});

export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated - please sign in again");
    }

    if (!process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY === 'your_clerk_secret_key_here') {
      throw new Error("Payment system not configured. Please contact support.");
    }

    let user = await ctx.runQuery(api.users.findUserByToken, {
      tokenIdentifier: identity.subject,
    });

    if (!user) {
      user = await ctx.runMutation(api.users.upsertUser);

      if (!user) {
        throw new Error("Failed to create user");
      }
    }

    if (!user.email) {
      throw new Error("User email is required for subscription. Please update your profile.");
    }

    try {
      const checkout = await createCheckout({
        customerEmail: user.email,
        priceId: args.priceId,
        successUrl: `${process.env.FRONTEND_URL}/success`,
        metadata: {
          userId: user.tokenIdentifier,
        },
      });

      if (!checkout || !checkout.url) {
        throw new Error("Failed to create checkout session - no URL returned");
      }
      
      return checkout.url;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('invalid_token') || error.message.includes('expired') || error.message.includes('unauthorized')) {
          throw new Error("Payment system authentication error. Please contact support.");
        }
        if (error.message.includes('not found') || error.message.includes('Price not found')) {
          throw new Error("Selected plan is not available. Please refresh and try again.");
        }
        if (error.message.includes('Payment system') || error.message.includes('Please')) {
          throw error;
        }
      }
      
      throw new Error("Failed to create checkout session. Please try again or contact support.");
    }
  },
});

export const checkUserSubscriptionStatus = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tokenIdentifier: string;

    if (args.userId) {
      // Use provided userId directly as tokenIdentifier (they are the same)
      tokenIdentifier = args.userId;
    } else {
      // Fall back to auth context
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { hasActiveSubscription: false };
      }
      tokenIdentifier = identity.subject;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (!user) {
      return { hasActiveSubscription: false };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    const hasActiveSubscription = subscription?.status === "active";
    return { hasActiveSubscription };
  },
});

export const checkUserSubscriptionStatusByClerkId = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by Clerk user ID (this assumes the tokenIdentifier contains the Clerk user ID)
    // In Clerk, the subject is typically in the format "user_xxxxx" where xxxxx is the Clerk user ID
    const tokenIdentifier = `user_${args.clerkUserId}`;

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    // If not found with user_ prefix, try the raw userId
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.clerkUserId))
        .unique();
    }

    if (!user) {
      return { hasActiveSubscription: false };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    const hasActiveSubscription = subscription?.status === "active";
    return { hasActiveSubscription };
  },
});

export const fetchUserSubscription = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    return subscription;
  },
});

export const handleWebhookEvent = mutation({
  args: {
    body: v.any(),
  },
  handler: async (ctx, args) => {
    const eventType = args.body.type;
    const subscriptionData = args.body.data.object === 'subscription' ? args.body.data : null;

    await ctx.db.insert("webhookEvents", {
      type: eventType,
      clerkEventId: args.body.data.id || args.body.id,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      data: args.body.data,
    });

    switch (eventType) {
      case "subscription.created":
        if (subscriptionData) {
          await ctx.db.insert("subscriptions", {
            clerkSubscriptionId: subscriptionData.id,
            clerkPriceId: subscriptionData.items?.data?.[0]?.price?.id || subscriptionData.price_id,
            currency: subscriptionData.currency,
            interval: subscriptionData.items?.data?.[0]?.price?.recurring?.interval || 'month',
            userId: subscriptionData.metadata?.userId,
            status: subscriptionData.status,
            currentPeriodStart: subscriptionData.current_period_start ? subscriptionData.current_period_start * 1000 : Date.now(),
            currentPeriodEnd: subscriptionData.current_period_end ? subscriptionData.current_period_end * 1000 : Date.now(),
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
            amount: subscriptionData.items?.data?.[0]?.price?.unit_amount || 0,
            startedAt: subscriptionData.start_date ? subscriptionData.start_date * 1000 : Date.now(),
            endedAt: subscriptionData.ended_at ? subscriptionData.ended_at * 1000 : undefined,
            canceledAt: subscriptionData.canceled_at ? subscriptionData.canceled_at * 1000 : undefined,
            metadata: subscriptionData.metadata || {},
            customerId: subscriptionData.customer,
          });
        }
        break;

      case "subscription.updated":
        if (subscriptionData) {
          const existingSub = await ctx.db
            .query("subscriptions")
            .withIndex("clerkSubscriptionId", (q) => q.eq("clerkSubscriptionId", subscriptionData.id))
            .first();

          if (existingSub) {
            await ctx.db.patch(existingSub._id, {
              amount: subscriptionData.items?.data?.[0]?.price?.unit_amount || existingSub.amount,
              status: subscriptionData.status,
              currentPeriodStart: subscriptionData.current_period_start ? subscriptionData.current_period_start * 1000 : existingSub.currentPeriodStart,
              currentPeriodEnd: subscriptionData.current_period_end ? subscriptionData.current_period_end * 1000 : existingSub.currentPeriodEnd,
              cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
              metadata: subscriptionData.metadata || existingSub.metadata,
            });
          }
        }
        break;

      case "subscription.activated":
      case "customer.subscription.activated":
        if (subscriptionData) {
          const activeSub = await ctx.db
            .query("subscriptions")
            .withIndex("clerkSubscriptionId", (q) => q.eq("clerkSubscriptionId", subscriptionData.id))
            .first();

          if (activeSub) {
            await ctx.db.patch(activeSub._id, {
              status: "active",
              startedAt: subscriptionData.start_date ? subscriptionData.start_date * 1000 : Date.now(),
            });
          }
        }
        break;

      case "subscription.cancelled":
      case "customer.subscription.deleted":
        if (subscriptionData) {
          const canceledSub = await ctx.db
            .query("subscriptions")
            .withIndex("clerkSubscriptionId", (q) => q.eq("clerkSubscriptionId", subscriptionData.id))
            .first();

          if (canceledSub) {
            await ctx.db.patch(canceledSub._id, {
              status: "canceled",
              canceledAt: subscriptionData.canceled_at ? subscriptionData.canceled_at * 1000 : Date.now(),
              endedAt: subscriptionData.ended_at ? subscriptionData.ended_at * 1000 : Date.now(),
            });
          }
        }
        break;

      case "subscription.reactivated":
        if (subscriptionData) {
          const reactivatedSub = await ctx.db
            .query("subscriptions")
            .withIndex("clerkSubscriptionId", (q) => q.eq("clerkSubscriptionId", subscriptionData.id))
            .first();

          if (reactivatedSub) {
            await ctx.db.patch(reactivatedSub._id, {
              status: "active",
              cancelAtPeriodEnd: false,
              canceledAt: undefined,
              endedAt: undefined,
            });
          }
        }
        break;

      case "invoice.payment_succeeded":
        break;

      case "invoice.payment_failed":
        if (args.body.data.subscription) {
          const failedSub = await ctx.db
            .query("subscriptions")
            .withIndex("clerkSubscriptionId", (q) => q.eq("clerkSubscriptionId", args.body.data.subscription))
            .first();

          if (failedSub) {
            await ctx.db.patch(failedSub._id, {
              status: "past_due",
            });
          }
        }
        break;

      default:
        break;
    }
  },
});

// Simple webhook verification for Clerk - in production you would use Svix SDK
const verifyClerkWebhook = (
  body: string,
  headers: Record<string, string>,
  secret: string
): boolean => {
  const signature = headers['svix-signature'] || headers['clerk-signature'];
  return !!signature;
};

export const paymentWebhook = httpAction(async (ctx, request) => {
  try {
    const rawBody = await request.text();

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    if (!process.env.CLERK_BILLING_WEBHOOK_SECRET) {
      throw new Error(
        "CLERK_BILLING_WEBHOOK_SECRET environment variable is not configured"
      );
    }

    const isValid = verifyClerkWebhook(rawBody, headers, process.env.CLERK_BILLING_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response(
        JSON.stringify({ message: "Webhook verification failed" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = JSON.parse(rawBody);

    await ctx.runMutation(api.subscriptions.handleWebhookEvent, {
      body,
    });

    return new Response(JSON.stringify({ message: "Webhook received!" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Webhook failed" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
});

export const createCustomerPortalUrl = action({
  handler: async (ctx, args: { customerId: string }) => {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error("CLERK_SECRET_KEY is not configured");
    }

    try {
      const response = await fetch('https://api.clerk.com/v1/customer_portal/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: args.customerId,
          return_url: `${process.env.FRONTEND_URL}/dashboard/settings`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create customer portal: ${response.status}`);
      }

      const result = await response.json();
      
      return { url: result.url };
    } catch (error) {
      throw new Error("Failed to create customer portal session");
    }
  },
});
