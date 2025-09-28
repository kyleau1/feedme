import { MessageCircle, Building2, BarChart3, Workflow } from "lucide-react";

const futureFeatures = [
  {
    icon: MessageCircle,
    title: "Slack Integration",
    description: "Notifications and responses directly in Slack for seamless workflow integration."
  },
  {
    icon: Building2,
    title: "Restaurant Capacity Management",
    description: "Handle large orders across multiple restaurants to prevent overwhelming single locations."
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Team preferences and ordering patterns with detailed insights for better planning."
  },
  {
    icon: Workflow,
    title: "Custom Workflows",
    description: "Automated reminders and follow-ups with configurable business rules."
  }
];

const FutureFeatures = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent rounded-full px-6 py-2 mb-6">
            <span className="text-accent-foreground font-medium">Coming Soon</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Future <span className="text-gradient-primary">Enhancements</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Exciting features in development to make corporate food ordering even more powerful
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {futureFeatures.map((feature, index) => (
            <div 
              key={index} 
              className="card-feature animate-slide-up group opacity-80 hover:opacity-100 transition-opacity"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-accent/50 rounded-xl flex items-center justify-center group-hover:bg-primary/50 transition-colors duration-300">
                  <feature.icon className="h-8 w-8 text-accent-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FutureFeatures;