import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "HR Manager",
    company: "TechFlow Corp",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b547?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
    content: "FeedME has eliminated the administrative nightmare of corporate food ordering. The DoorDash integration and response tracking save me hours every week.",
    rating: 5
  },
  {
    name: "Marcus Rodriguez",
    role: "Team Lead",
    company: "Enterprise Solutions",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
    content: "Finally, I can see who's ordering and who's not without chasing people down. The deadline management features are exactly what busy teams need.",
    rating: 5
  },
  {
    name: "Emma Thompson",
    role: "Operations Director",
    company: "Corporate Dynamics",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
    content: "The preset ordering feature is brilliant for our traveling executives. They can set preferences in advance and never miss a team meal.",
    rating: 5
  }
];

const companyLogos = [
  { name: "TechFlow Corp", width: "w-24" },
  { name: "Enterprise Solutions", width: "w-28" },
  { name: "Corporate Dynamics", width: "w-32" },
  { name: "Global Industries", width: "w-26" },
  { name: "Business Tech", width: "w-24" }
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            What Corporate Teams Are Saying
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of corporate teams who have streamlined their food management
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="card-testimonial animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-6">
                <Quote className="h-8 w-8 text-primary mb-4" />
                <p className="text-foreground leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.image} 
                  alt={`${testimonial.name} profile picture`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                />
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Company Logos */}
        <div className="text-center animate-fade-in">
          <p className="text-sm text-muted-foreground mb-8">
            Trusted by corporate teams at leading companies
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
            {companyLogos.map((logo, index) => (
              <div 
                key={index} 
                className={`${logo.width} h-8 bg-muted-foreground rounded flex items-center justify-center`}
              >
                <span className="text-xs font-semibold text-background">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;