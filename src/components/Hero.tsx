import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative bg-gradient-hero min-h-screen flex items-center">
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in">
            <h1 className="text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              <span className="text-gradient-primary">FeedME</span>
            </h1>
            <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-6">
              Streamline Corporate Food Ordering with DoorDash Integration
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Eliminate the chaos of group food decisions. Track responses, manage deadlines, 
              and integrate seamlessly with DoorDash's group ordering.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                size="lg" 
                className="btn-primary px-8 py-4 text-lg font-semibold rounded-xl group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="btn-secondary px-8 py-4 text-lg font-semibold rounded-xl"
              >
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="animate-slide-up lg:animate-scale-in">
            <div className="relative">
              <img
                src={heroImage}
                alt="Managers and employees using FeedME platform for corporate food ordering"
                className="w-full h-auto rounded-2xl shadow-teal"
              />
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="text-2xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground">Teams Served</div>
              </div>
              <div className="absolute -top-6 -right-6 bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Orders Processed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;