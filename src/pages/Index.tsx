import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, TreePine, Recycle, Users, ArrowRight, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-nature.jpg";

function AnimatedCounter({ target, label, icon }: { target: number; label: string; icon: React.ReactNode }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="flex flex-col items-center gap-2 animate-count-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <span className="font-display text-3xl font-bold text-foreground">{count.toLocaleString()}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

const steps = [
  { icon: <CheckCircle className="h-6 w-6" />, title: "Participate", desc: "Join eco-activities like tree planting, cleanups, and recycling drives." },
  { icon: <CheckCircle className="h-6 w-6" />, title: "Get Verified", desc: "Submit proof — organizers review and approve your contribution." },
  { icon: <CheckCircle className="h-6 w-6" />, title: "Earn Points", desc: "Accumulate points, unlock badges, and climb the leaderboard." },
  { icon: <CheckCircle className="h-6 w-6" />, title: "Make Impact", desc: "Track your environmental footprint and inspire your community." },
];

export default function Index() {
  const [stats, setStats] = useState({ activities: 0, users: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: actCount }, { count: userCount }] = await Promise.all([
        supabase.from("activities").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      setStats({ activities: actCount ?? 0, users: userCount ?? 0 });
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with image */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="Lush green forest landscape" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
        </div>

        {/* Floating leaf decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute left-[8%] top-[15%] text-4xl opacity-20 animate-float" style={{ animationDelay: "0s" }}>🍃</span>
          <span className="absolute right-[12%] top-[20%] text-3xl opacity-15 animate-float" style={{ animationDelay: "0.8s" }}>🌿</span>
          <span className="absolute left-[20%] bottom-[25%] text-5xl opacity-10 animate-float" style={{ animationDelay: "1.5s" }}>🌱</span>
          <span className="absolute right-[8%] bottom-[30%] text-4xl opacity-15 animate-float" style={{ animationDelay: "2s" }}>🍂</span>
          <span className="absolute left-[45%] top-[10%] text-3xl opacity-10 animate-float" style={{ animationDelay: "0.5s" }}>🌳</span>
        </div>

        <div className="container relative mx-auto px-4 py-28 text-center lg:py-40">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
              <Leaf className="h-4 w-4" /> Community-Powered Environmental Impact
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground drop-shadow-sm sm:text-5xl lg:text-6xl">
              Track Your <span className="text-primary">Green Impact</span>, One Action at a Time
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Join thousands of eco-warriors making a measurable difference. Plant trees, clean up neighborhoods, recycle — and earn rewards for every action.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-base px-8 shadow-lg shadow-primary/20">
                <Link to="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 backdrop-blur-sm">
                <Link to="/leaderboard">View Leaderboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card py-16">
        <div className="container mx-auto grid grid-cols-1 gap-8 px-4 sm:grid-cols-3">
          <AnimatedCounter target={stats.activities} label="Activities Completed" icon={<TreePine className="h-6 w-6" />} />
          <AnimatedCounter target={stats.activities * 3} label="kg Waste Collected" icon={<Recycle className="h-6 w-6" />} />
          <AnimatedCounter target={stats.users} label="Active Eco-Warriors" icon={<Users className="h-6 w-6" />} />
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20">
        {/* Subtle leaf accents */}
        <div className="pointer-events-none absolute left-0 top-0 text-8xl opacity-[0.03]">🌿</div>
        <div className="pointer-events-none absolute bottom-0 right-0 text-8xl opacity-[0.03]">🍃</div>
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">How It Works</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Four simple steps to start making a real environmental impact in your community.</p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Card key={i} className="group relative overflow-hidden border-primary/10 transition-shadow hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {s.icon}
                  </div>
                  <div className="absolute right-4 top-4 font-display text-4xl font-black text-primary/5">0{i + 1}</div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nature image strip */}
      <section className="relative h-48 overflow-hidden sm:h-64">
        <img src={heroImage} alt="Green forest" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display text-2xl font-bold text-primary-foreground drop-shadow-lg sm:text-3xl">
            🌍 Every Action Counts
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display font-bold text-foreground">
            <Leaf className="h-4 w-4 text-primary" /> EcoTrack
          </div>
          <p>© {new Date().getFullYear()} EcoTrack. Making every action count.</p>
        </div>
      </footer>
    </div>
  );
}
