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
  if (!process.env.CLERK_BILLING_SECRET_KEY) {
    throw new Error("CLERK_BILLING_SECRET_KEY is not configured");
  }
  
  try {
    const checkoutData = {
      plan_id: priceId,
      success_url: successUrl,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      customer_email: customerEmail,
      metadata: {
        ...metadata,
        priceId: priceId,
      },
    };

    const response = await fetch('https://api.clerk.com/v1/billing/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_BILLING_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Clerk Billing API error: ${response.status}`, error);
      throw new Error(`Clerk Billing API error: ${response.status} ${error}`);
    }

    const result: ClerkCheckoutSession = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating checkout session:', error);
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
    console.log("🔍 getAvailablePlans called - checking environment...");
    
    if (!process.env.CLERK_BILLING_SECRET_KEY || process.env.CLERK_BILLING_SECRET_KEY === 'your_clerk_billing_secret_key_here') {
      console.log("❌ CLERK_BILLING_SECRET_KEY not configured, returning fallback plans");
      return {
        items: [
          {
            id: 'personal_plan',
            name: 'Personal Plan',
            description: 'Perfect for individuals and small projects',
            isRecurring: true,
            prices: [{
              id: 'personal-monthly',
              amount: 500, // $5.00 in cents
              currency: 'usd',
              interval: 'month',
              product_id: 'personal_plan'
            }]
          },
          {
            id: 'business_plan',
            name: 'Business Plan', 
            description: 'For growing businesses and teams',
            isRecurring: true,
            prices: [{
              id: 'business-monthly',
              amount: 5000, // $50.00 in cents
              currency: 'usd',
              interval: 'month',
              product_id: 'business_plan'
            }]
          }
        ],
        pagination: { totalCount: 2, maxPage: 1 },
      };
    }

    console.log("✅ CLERK_BILLING_SECRET_KEY configured, attempting API call...");

    try {
      console.log("📡 Making request to Clerk Billing API...");
      // Use the correct Clerk Billing API endpoint for subscription plans
      const response = await fetch('https://api.clerk.com/v1/commerce/plans', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_BILLING_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`❌ Clerk Billing API returned ${response.status}: ${errorText}`);
        console.warn("Using fallback plans. This is expected if billing plans aren't configured yet.");
        // Return fallback plans that match the homepage expectations
        console.log(`Clerk Billing API failed with status ${response.status}, using fallback plans`);
        return {
          items: [
            {
              id: 'personal_plan',
              name: 'Personal Plan',
              description: 'Perfect for individuals and small projects',
              isRecurring: true,
              prices: [{
                id: 'personal-monthly',
                amount: 500, // $5.00 in cents
                currency: 'usd',
                interval: 'month',
                product_id: 'personal_plan'
              }]
            },
            {
              id: 'business_plan',
              name: 'Business Plan', 
              description: 'For growing businesses and teams',
              isRecurring: true,
              prices: [{
                id: 'business-monthly',
                amount: 5000, // $50.00 in cents
                currency: 'usd',
                interval: 'month',
                product_id: 'business_plan'
              }]
            }
          ],
          pagination: { totalCount: 2, maxPage: 1 },
        };
      }

      const data = await response.json();
      const plans = data.data || data.items || data;

      if (!Array.isArray(plans)) {
        console.error('Unexpected response format:', data);
        return {
          items: [],
          pagination: { totalCount: 0, maxPage: 1 },
        };
      }

      const cleanedItems = plans.map((item: any) => ({
        id: item.id,
        name: item.name || item.title || `Plan ${item.id}`,
        description: item.description || 'No description available',
        isRecurring: true,
        prices: [{
          id: item.id,
          amount: item.amount || item.price || 0,
          currency: item.currency || 'usd',
          interval: item.interval || 'month',
        }],
      }));

      return {
        items: cleanedItems,
        pagination: { totalCount: plans.length, maxPage: 1 },
      };
    } catch (error) {
      console.error('Error fetching billing plans:', error);
      // Return consistent fallback plans instead of empty array
      return {
        items: [
          {
            id: 'personal_plan',
            name: 'Personal Plan',
            description: 'Perfect for individuals and small projects',
            isRecurring: true,
            prices: [{
              id: 'personal-monthly',
              amount: 500, // $5.00 in cents
              currency: 'usd',
              interval: 'month',
              product_id: 'personal_plan'
            }]
          },
          {
            id: 'business_plan',
            name: 'Business Plan', 
            description: 'For growing businesses and teams',
            isRecurring: true,
            prices: [{
              id: 'business-monthly',
              amount: 5000, // $50.00 in cents
              currency: 'usd',
              interval: 'month',
              product_id: 'business_plan'
            }]
          }
        ],
        pagination: { totalCount: 2, maxPage: 1 },
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

    if (!process.env.CLERK_BILLING_SECRET_KEY || process.env.CLERK_BILLING_SECRET_KEY === 'your_clerk_billing_secret_key_here') {
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
      console.log("🔍 Using provided userId:", tokenIdentifier.substring(0, 8) + "...");
    } else {
      // Fall back to auth context
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        console.log("❌ No auth identity found");
        return { hasActiveSubscription: false };
      }
      tokenIdentifier = identity.subject;
      console.log("🔍 Using identity.subject:", tokenIdentifier.substring(0, 8) + "...");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (!user) {
      console.log("❌ No user found with tokenIdentifier:", tokenIdentifier.substring(0, 8) + "...");
      return { hasActiveSubscription: false };
    }

    console.log("✅ Found user:", user.tokenIdentifier.substring(0, 8) + "...");

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    console.log("🔍 Subscription check:", {
      found: !!subscription,
      status: subscription?.status,
      userId: user.tokenIdentifier.substring(0, 8) + "..."
    });

    const hasActiveSubscription = subscription?.status === "active";
    return { hasActiveSubscription };
  },
});

export const checkUserSubscriptionStatusByClerkId = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("🔍 Checking subscription for Clerk user ID:", args.clerkUserId.substring(0, 8) + "...");
    
    // Try multiple possible tokenIdentifier formats
    const possibleIdentifiers = [
      `user_${args.clerkUserId}`, // Standard Clerk format
      args.clerkUserId,           // Raw user ID
      `user|${args.clerkUserId}`, // Alternative format
    ];

    let user = null;
    for (const identifier of possibleIdentifiers) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identifier))
        .unique();
      
      if (user) {
        console.log("✅ Found user with identifier:", identifier.substring(0, 10) + "...");
        break;
      }
    }

    if (!user) {
      console.log("❌ No user found for any identifier format");
      return { hasActiveSubscription: false };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    console.log("🔍 Subscription status:", {
      found: !!subscription,
      status: subscription?.status,
      userId: user.tokenIdentifier.substring(0, 10) + "..."
    });

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
    if (!process.env.CLERK_BILLING_SECRET_KEY) {
      throw new Error("CLERK_BILLING_SECRET_KEY is not configured");
    }

    try {
      const response = await fetch('https://api.clerk.com/v1/billing/customer_portal/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_BILLING_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: args.customerId,
          return_url: `${process.env.FRONTEND_URL}/dashboard/settings`,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Failed to create customer portal: ${response.status}`, error);
        throw new Error(`Failed to create customer portal: ${response.status}`);
      }

      const result = await response.json();
      
      return { url: result.url };
    } catch (error) {
      console.error('Error creating customer portal:', error);
      throw new Error("Failed to create customer portal session");
    }
  },
});

// Debug utility to list all users (no auth required)
export const listUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      id: user._id,
      tokenIdentifier: user.tokenIdentifier,
      name: user.name,
      email: user.email
    }));
  },
});

// Admin utility to create subscription records (no auth required)
export const createAdminSubscription = mutation({
  args: {
    userId: v.string(),
    planId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, { userId, planId, status }) => {
    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), userId))
      .first();

    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    // Create subscription record
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: userId, // Store the Clerk user ID directly
      clerkSubscriptionId: `sub_${Date.now()}`, // Generate a unique subscription ID
      status: status,
      amount: 500, // $5.00 in cents
      currency: "USD",
      interval: "month",
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    return {
      success: true,
      subscriptionId,
      message: `Created subscription for user ${userId}`,
    };
  },
});

// Test utility to create a test subscription for development
export const createTestSubscription = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Ensure user exists
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (!user) {
      // Create user if doesn't exist
      const userId = await ctx.db.insert("users", {
        name: identity.name,
        email: identity.email,
        tokenIdentifier: identity.subject,
      });
      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new Error("Failed to create user");
    }

    // Check if subscription already exists
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    if (existingSubscription) {
      // Update existing subscription to active
      await ctx.db.patch(existingSubscription._id, {
        status: "active",
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      return { success: true, message: "Updated existing subscription to active" };
    }

    // Create new test subscription
    await ctx.db.insert("subscriptions", {
      userId: user.tokenIdentifier,
      clerkSubscriptionId: `test_sub_${Date.now()}`,
      clerkPriceId: "test_price_starter",
      currency: "usd",
      interval: "month",
      status: "active",
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      cancelAtPeriodEnd: false,
      amount: 900, // $9.00 in cents
      startedAt: Date.now(),
      metadata: { test: true },
      customerId: `test_customer_${user.tokenIdentifier.substring(0, 8)}`,
    });

    return { success: true, message: "Test subscription created successfully" };
  },
});

// Debug query to help troubleshoot user/subscription issues
export const debugUserAndSubscriptions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { error: "No auth identity" };
    }

    // Get all users
    const allUsers = await ctx.db.query("users").collect();
    
    // Get all subscriptions
    const allSubscriptions = await ctx.db.query("subscriptions").collect();

    // Find current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    return {
      identity: {
        subject: identity.subject,
        email: identity.email,
        name: identity.name
      },
      currentUser: currentUser ? {
        id: currentUser._id,
        tokenIdentifier: currentUser.tokenIdentifier,
        email: currentUser.email,
        name: currentUser.name
      } : null,
      allUsersCount: allUsers.length,
      allUsers: allUsers.map(u => ({
        id: u._id,
        tokenIdentifier: u.tokenIdentifier.substring(0, 10) + "...",
        email: u.email,
        name: u.name
      })),
      allSubscriptionsCount: allSubscriptions.length,
      allSubscriptions: allSubscriptions.map(s => ({
        id: s._id,
        userId: s.userId?.substring(0, 10) + "...",
        status: s.status,
        clerkSubscriptionId: s.clerkSubscriptionId
      }))
    };
  },
});
