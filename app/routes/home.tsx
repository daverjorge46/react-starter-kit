import { getAuth } from "@clerk/react-router/ssr.server";
import { fetchAction, fetchQuery } from "convex/nextjs";
import ContentSection from "~/components/homepage/content";
import TechStackSection from "~/components/homepage/featured-documents";
import Footer from "~/components/homepage/footer";
import Integrations from "~/components/homepage/integrations";
import Pricing from "~/components/homepage/pricing";
import TrustIndicators from "~/components/homepage/trust-indicators";
import { api } from "../../convex/_generated/api";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  const title = import.meta.env.VITE_SITE_TITLE || "React Starter Kit - Launch Your SaaS in Weeks, Not Months";
  const description = import.meta.env.VITE_SITE_DESCRIPTION ||
    "Stop rebuilding the same foundation. Get a complete, production-ready SaaS template with authentication, payments, AI chat, and real-time data working seamlessly out of the box.";
  const keywords = import.meta.env.VITE_SITE_KEYWORDS || "React Starter Kit, SaaS Template, React Router v7, Convex, Clerk, Clerk Billing, TypeScript, TailwindCSS";
  const siteUrl = import.meta.env.VITE_SITE_URL || "https://www.reactstarter.xyz/";
  const imageUrl = import.meta.env.VITE_SITE_IMAGE ||
    "https://jdj14ctwppwprnqu.public.blob.vercel-storage.com/rsk-image-FcUcfBMBgsjNLo99j3NhKV64GT2bQl.png";

  return [
    { title },
    {
      name: "description",
      content: description,
    },

    // Open Graph / Facebook
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:url", content: siteUrl },
    { property: "og:site_name", content: "React Starter Kit" },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    {
      name: "twitter:description",
      content: description,
    },
    { name: "twitter:image", content: imageUrl },
    {
      name: "keywords",
      content: keywords,
    },
    { name: "author", content: "Ras Mic" },
    { name: "favicon", content: imageUrl },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  try {
    // Handle authentication more gracefully - don't throw on handshake
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
          console.log("Unexpected auth error:", authError);
        }
        // 307 redirects are normal auth handshake flow, don't log them
      } else {
        console.log("Auth handshake in progress");
      }
      userId = null;
    }

    // Always fetch plans, conditionally fetch subscription data
    const [plans, fetchedSubscriptionData] = await Promise.all([
      fetchAction(api.subscriptions.getAvailablePlans).catch((error) => {
        console.error("Failed to fetch plans:", error);
        return { items: [], pagination: { totalCount: 0, maxPage: 1 } };
      }),
      userId
        ? fetchQuery(api.subscriptions.checkUserSubscriptionStatus, {
            userId,
          }).catch((error) => {
            console.error("Failed to fetch subscription data:", error);
            return null;
          })
        : Promise.resolve(null),
    ]);

    subscriptionData = fetchedSubscriptionData;

    return {
      isSignedIn: !!userId,
      hasActiveSubscription: subscriptionData?.hasActiveSubscription || false,
      plans,
    };
  } catch (error) {
    console.error("Loader error:", error);
    // Return safe defaults if anything fails
    return {
      isSignedIn: false,
      hasActiveSubscription: false,
      plans: { items: [], pagination: { totalCount: 0, maxPage: 1 } },
    };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <Integrations loaderData={loaderData} />
      <ContentSection />
      <TechStackSection />
      <TrustIndicators />
      <Pricing loaderData={loaderData} />
      <Footer />
    </>
  );
}
