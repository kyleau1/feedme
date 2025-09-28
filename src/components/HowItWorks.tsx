import { Settings, Users, Truck } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Settings,
    title: "Manager Creates Session",
    description: "Set restaurant, time limits, and team members. Configure deadline rules and notification preferences for optimal team coordination."
  },
  {
    number: "02",
    icon: Users,
    title: "Team Members Respond",
    description: "Order, pass, or send preset messages. Complete visibility into who's ordering and who's unavailable with clear deadline tracking."
  },
  {
    number: "03",
    icon: Truck,
    title: "DoorDash Integration",
    description: "Seamless checkout through DoorDash's platform. Automatic order compilation and corporate billing integration for streamlined processing."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How <span className="text-gradient-primary">FeedME</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Three simple steps to transform corporate food ordering management
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-20 left-1/6 right-1/6 h-px bg-gradient-to-r from-primary via-primary to-primary opacity-30"></div>
            
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-teal">
                    <step.icon className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent border-2 border-background rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-accent-foreground">{step.number}</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;