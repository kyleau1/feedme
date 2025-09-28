import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 10 team members",
      "Basic response tracking",
      "DoorDash integration",
      "Simple deadline management",
      "Email support"
    ],
    cta: "Get Started Free",
    popular: false
  },
  {
    name: "Professional",
    price: "$29",
    period: "per month",
    description: "Everything corporate teams need for efficient food ordering",
    features: [
      "Up to 50 team members",
      "Advanced response tracking",
      "Preset ordering system",
      "Custom deadline rules",
      "Analytics & reporting",
      "Slack notifications",
      "Priority support",
      "Team preference management"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "Advanced features for large organizations",
    features: [
      "Unlimited team members",
      "Single sign-on (SSO)",
      "Advanced admin controls",
      "Custom integrations",
      "Multi-location support",
      "Dedicated account manager",
      "Custom onboarding",
      "24/7 priority support"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

const Pricing = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that works best for your team. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`card-pricing animate-slide-up relative ${
                plan.popular ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-1">/{plan.period}</span>
                  )}
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className={`w-full rounded-xl font-semibold ${
                  plan.popular 
                    ? 'btn-primary' 
                    : plan.name === 'Enterprise' 
                    ? 'btn-secondary' 
                    : 'btn-ghost border border-border'
                }`}
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <div className="text-center mt-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent rounded-full px-6 py-3">
            <Check className="h-5 w-5 text-accent-foreground" />
            <span className="text-accent-foreground font-medium">
              30-day money-back guarantee on all paid plans
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;