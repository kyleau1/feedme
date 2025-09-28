import { MessageSquare, Clock, Users, AlertTriangle } from "lucide-react";

const problems = [
  {
    icon: MessageSquare,
    problem: "Tired of tracking who ordered what in group chats?",
    solution: "Dedicated response tracking with clear visibility into every team member's order status."
  },
  {
    icon: AlertTriangle,
    problem: "Struggling with large orders overwhelming restaurants?",
    solution: "Smart deadline management and DoorDash integration handle capacity automatically."
  },
  {
    icon: Users,
    problem: "Need to know who's available for lunch meetings?",
    solution: "Preset ordering and response tracking keep you informed of team availability."
  },
  {
    icon: Clock,
    problem: "Want to set time limits on food decisions?",
    solution: "Automated deadline management with smart notifications and auto-pass features."
  }
];

const ProblemSolution = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Solving Real <span className="text-gradient-primary">Corporate</span> Pain Points
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Address the challenges that make team food ordering a daily headache
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {problems.map((item, index) => (
            <div 
              key={index} 
              className="card-feature animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {item.problem}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;