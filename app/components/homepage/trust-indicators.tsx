export default function TrustIndicators() {
  const stats = [
    {
      value: "1000+",
      label: "Developers Using RSK",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      value: "50+",
      label: "SaaS Apps Launched",
      gradient: "from-pink-500 to-pink-600"
    },
    {
      value: "10+",
      label: "Integrated Services",
      gradient: "from-blue-500 to-blue-600"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-background dark:bg-background">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Proven & Battle-Tested
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Developers worldwide choose RSK to launch their SaaS applications faster
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-8 md:grid-cols-3 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="relative mb-4">
                <div className={`text-6xl md:text-7xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                  {stat.value}
                </div>
              </div>
              <p className="text-xl font-medium text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Progress Bars for Visual Interest */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Development Speed Increase</span>
            <span>10x Faster</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: "100%" }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 mt-6">
            <span>Integration Completeness</span>
            <span>95% Ready</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: "95%" }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 mt-6">
            <span>Developer Satisfaction</span>
            <span>98% Happy</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: "98%" }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}