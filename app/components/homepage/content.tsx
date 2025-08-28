import { Button } from "~/components/ui/button";
import { ChevronRight, Rocket, Code, Database } from "lucide-react";
import { Link } from "react-router";

export default function ContentSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-background dark:bg-background">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Everything You Need
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stop rebuilding the same foundation. RSK provides a complete, production-ready SaaS template.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Fast Development Feature */}
          <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 shadow-lg hover:shadow-xl transition-all duration-300 feature-card-gradient">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-card-foreground">Launch in Weeks</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              From idea to launch in weeks, not months. With TypeScript safety, modern UI components, and scalable architecture built-in, validate your business concept quickly.
            </p>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80 p-0 h-auto group-hover:translate-x-2 transition-transform duration-300"
              asChild
            >
              <Link to="#pricing" className="inline-flex items-center gap-2">
                <span className="font-semibold">Get Started</span>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>

          {/* Modern Stack Feature */}
          <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 shadow-lg hover:shadow-xl transition-all duration-300 feature-card-gradient">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <Code className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-card-foreground">Modern Tech Stack</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Built with React Router v7, TailwindCSS v4, shadcn/ui, and TypeScript. Everything configured and ready to go with hot module replacement and fast builds.
            </p>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80 p-0 h-auto group-hover:translate-x-2 transition-transform duration-300"
              asChild
            >
              <Link to="#pricing" className="inline-flex items-center gap-2">
                <span className="font-semibold">Get Started</span>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>

          {/* Complete Backend Feature */}
          <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 shadow-lg hover:shadow-xl transition-all duration-300 feature-card-gradient">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <Database className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-card-foreground">Complete Backend</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Authentication with Clerk, real-time database with Convex, subscription billing with Polar.sh, and AI chat with OpenAI - all pre-integrated and working.
            </p>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80 p-0 h-auto group-hover:translate-x-2 transition-transform duration-300"
              asChild
            >
              <Link to="#team" className="inline-flex items-center gap-2">
                <span className="font-semibold">Learn More</span>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
