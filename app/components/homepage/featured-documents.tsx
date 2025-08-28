import { Code2, Database, CreditCard, Bot } from "lucide-react";

export default function TechStackSection() {
  const techStack = [
    {
      category: "Frontend",
      title: "React Router v7 + TypeScript",
      description: "Modern full-stack React framework with server-side rendering, hot module replacement, and complete type safety throughout your application.",
      icon: <Code2 className="h-6 w-6" />,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      category: "Backend",
      title: "Convex Real-time Database",
      description: "Serverless database with real-time subscriptions, automatic scaling, and built-in authentication integration with your frontend.",
      icon: <Database className="h-6 w-6" />,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      category: "Payments",
      title: "Polar.sh Subscription Billing",
      description: "Complete subscription management with webhooks, customer portals, and seamless integration for recurring revenue models.",
      icon: <CreditCard className="h-6 w-6" />,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      category: "AI Features",
      title: "OpenAI Chat Integration",
      description: "Pre-built AI chat functionality with streaming responses, conversation history, and customizable AI personalities for your users.",
      icon: <Bot className="h-6 w-6" />,
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-muted/30 dark:bg-muted/5">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tech Stack Included
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything pre-configured and ready to go. No more weeks of setup and integration.
          </p>
        </div>

        {/* Tech Stack Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-20">
          {techStack.map((tech, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {/* Category Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${tech.gradient}`}>
                  {tech.category}
                </span>
              </div>

              {/* Tech Preview Area */}
              <div className="h-48 bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center relative overflow-hidden">
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${tech.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {tech.icon}
                </div>
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Tech Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2 text-card-foreground group-hover:text-primary transition-colors duration-300">
                  {tech.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tech.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}