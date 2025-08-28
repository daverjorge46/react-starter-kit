import { memo } from "react";
import { Link } from "react-router";
import { LogoIcon } from "~/components/logo";
import {
  Convex,
  Polar,
  ReactIcon,
  ReactRouter,
  TailwindIcon,
  Typescript,
} from "~/components/logos";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Navbar } from "./navbar";

export default function IntegrationsSection({
  loaderData,
}: {
  loaderData?: { isSignedIn: boolean; hasActiveSubscription: boolean };
}) {
  return (
    <section id="hero" className="relative min-h-screen">
      <Navbar loaderData={loaderData} />
      <div className="bg-docuverse-gradient dark:bg-docuverse-gradient py-24 md:py-32 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        <div className="mx-auto max-w-6xl px-6 mt-[4rem] relative z-10">
          <div className="text-center space-y-8">
            {/* Hero Title */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                Launch Your{" "}
                <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  SaaS
                </span>{" "}
                in Weeks, Not Months
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 max-w-4xl mx-auto leading-relaxed">
                Stop rebuilding the same foundation. Get a complete, production-ready SaaS template with authentication, payments, AI chat, and real-time data working seamlessly out of the box.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium border border-white/30">
                🚀 React Router v7
              </div>
              <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium border border-white/30">
                🔐 Clerk Auth
              </div>
              <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium border border-white/30">
                🗄️ Convex Database
              </div>
              <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium border border-white/30">
                💳 Polar.sh Billing
              </div>
              <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium border border-white/30">
                🤖 AI Chat
              </div>
              <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium border border-white/30">
                📱 Responsive
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button size="lg" className="px-8 py-4 text-lg bg-white text-purple-700 hover:bg-gray-50 shadow-xl" asChild>
                <Link
                  to={
                    loaderData?.isSignedIn
                      ? loaderData?.hasActiveSubscription
                        ? "/dashboard"
                        : "/pricing"
                      : "/sign-up"
                  }
                  prefetch="viewport"
                >
                  {loaderData?.isSignedIn
                    ? loaderData?.hasActiveSubscription
                      ? "Go to Dashboard"
                      : "Subscribe Now"
                    : "Get Started Free"}
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="#features">
                  📚 Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = memo(({
  children,
  className,
  borderClassName,
}: {
  children: React.ReactNode;
  className?: string;
  borderClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-background relative flex size-20 rounded-xl dark:bg-transparent",
        className
      )}
    >
      <div
        role="presentation"
        className={cn(
          "absolute inset-0 rounded-xl border border-black/20 dark:border-white/25",
          borderClassName
        )}
      />
      <div className="relative z-20 m-auto size-fit *:size-8">{children}</div>
    </div>
  );
});
