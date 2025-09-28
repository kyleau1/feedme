import { Truck, CheckCircle, Clock, Settings } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "DoorDash Integration",
    description: "Seamless connection with DoorDash's group ordering system for streamlined corporate meal management."
  },
  {
    icon: CheckCircle,
    title: "Response Tracking",
    description: "See who ordered, who passed, and why they didn't order. Complete visibility into your team's meal decisions."
  },
  {
    icon: Clock,
    title: "Deadline Management",
    description: "Set time limits and auto-pass non-responders. Never miss a deadline or delay the entire team again."
  },
  {
    icon: Settings,
    title: "Preset Ordering",
    description: "Team members can preset orders when unavailable. Smart automation for busy corporate schedules."
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Why Managers Choose <span className="text-gradient-primary">FeedME</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to transform corporate food ordering from 
            administrative burden to seamless automation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="card-feature animate-slide-up group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
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

export default Features;