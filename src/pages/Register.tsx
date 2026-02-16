import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Leaf } from "lucide-react";
import { FloatingLeaves, TreeSVG, BranchSVG } from "@/components/NatureDecorations";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<AppRole>("citizen");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, name, role, city);
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4">
      <FloatingLeaves />
      <TreeSVG className="pointer-events-none absolute bottom-0 left-[3%] h-52 w-52 text-eco-leaf" />
      <TreeSVG className="pointer-events-none absolute bottom-0 right-[6%] h-44 w-44 text-primary" />
      <BranchSVG className="pointer-events-none absolute left-0 top-16 h-14 w-48 text-primary" />
      <BranchSVG className="pointer-events-none absolute right-0 top-36 h-12 w-44 rotate-[8deg] text-accent" />

      <Card className="relative z-10 w-full max-w-md overflow-hidden">
        <div className="absolute -left-6 -top-6 text-8xl opacity-[0.04]">🌱</div>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Join EcoTrack</CardTitle>
          <CardDescription>Create your account and start making an impact</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City / Address</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="e.g. Mumbai, Delhi, New York" />
            </div>
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["citizen", "organizer"] as AppRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-all hover:scale-[1.02] ${
                      role === r ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {r === "citizen" ? "🌱 Citizen" : "🛡️ Organizer"}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
