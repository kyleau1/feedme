import { MessageSquareOff, CheckCircle, Clock, Truck, Shield } from "lucide-react";

const benefits = [
  {
    icon: MessageSquareOff,
    title: "Eliminate Group Chat Chaos",
    description: "Keep food ordering organized and out of your work channels. Dedicated platform for all corporate meal coordination.",
    stat: "90% Less Chat Noise"
  },
  {
    icon: CheckCircle,
    title: "Track Every Team Member's Response",
    description: "Complete visibility into who ordered, who passed, and why. Never wonder about team participation again.",
    stat: "100% Response Visibility"
  },
  {
    icon: Clock,
    title: "Never Miss a Deadline Again",
    description: "Automated deadline management with smart notifications and auto-pass features for non-responders.",
    stat: "95% On-Time Orders"
  },
  {
    icon: Truck,
    title: "Seamless DoorDash Integration",
    description: "Direct integration with DoorDash's group ordering system for streamlined corporate billing and delivery.",
    stat: "Zero Platform Switching"
  },
  {
    icon: Shield,
    title: "Reduce Administrative Overhead",
    description: "Automated workflows and preset options minimize manager time spent on food coordination tasks.",
    stat: "80% Admin Time Saved"
  }
];

const Benefits = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Why HR Managers Love <span className="text-gradient-primary">FeedME</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real results that streamline corporate food management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.slice(0, 3).map((benefit, index) => (
            <div 
              key={index}
              className="bg-gradient-card border border-border rounded-xl p-8 text-center animate-slide-up hover:shadow-teal transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <benefit.icon className="h-8 w-8 text-primary-foreground" />
              </div>
              
              <div className="mb-4">
                <div className="text-2xl font-bold text-primary mb-1">{benefit.stat}</div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {benefit.title}
                </h3>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Second Row */}
        <div className="grid md:grid-cols-2 gap-8 mt-8 max-w-4xl mx-auto">
          {benefits.slice(3).map((benefit, index) => (
            <div 
              key={index + 3}
              className="bg-gradient-card border border-border rounded-xl p-8 text-center animate-slide-up hover:shadow-teal transition-all duration-300"
              style={{ animationDelay: `${(index + 3) * 0.1}s` }}
            >
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <benefit.icon className="h-8 w-8 text-primary-foreground" />
              </div>
              
              <div className="mb-4">
                <div className="text-2xl font-bold text-primary mb-1">{benefit.stat}</div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {benefit.title}
                </h3>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-primary rounded-2xl p-12 text-center animate-scale-in">
          <div className="grid md:grid-cols-3 gap-8 text-primary-foreground">
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-lg opacity-90">Corporate Orders</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1,000+</div>
              <div className="text-lg opacity-90">Teams Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99%</div>
              <div className="text-lg opacity-90">Manager Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;