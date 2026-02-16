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

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4">
      <FloatingLeaves />
      <TreeSVG className="pointer-events-none absolute bottom-0 left-[5%] h-56 w-56 text-primary" />
      <TreeSVG className="pointer-events-none absolute bottom-0 right-[8%] h-40 w-40 text-eco-leaf" />
      <BranchSVG className="pointer-events-none absolute right-0 top-12 h-16 w-52 text-primary" />
      <BranchSVG className="pointer-events-none absolute left-0 top-32 h-12 w-40 rotate-[5deg] text-accent" />

      <Card className="relative z-10 w-full max-w-md overflow-hidden">
        <div className="absolute -right-8 -top-8 text-8xl opacity-[0.04]">🌿</div>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your EcoTrack account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/register" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
