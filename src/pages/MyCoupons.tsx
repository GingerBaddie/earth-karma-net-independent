import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { PageHeaderDecor, VineBorder } from "@/components/NatureDecorations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Copy, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type RedeemedCoupon = {
  id: string;
  points_spent: number;
  redeemed_at: string;
  coupon: {
    id: string;
    title: string;
    description: string | null;
    icon: string;
    coupon_code: string;
    expiry_date: string | null;
  };
};

export default function MyCoupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<RedeemedCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_coupons" as any)
        .select("*, coupon:coupon_id(*)")
        .eq("user_id", user.id)
        .order("redeemed_at", { ascending: false });
      if (data) setCoupons(data as unknown as RedeemedCoupon[]);
      setLoading(false);
    })();
  }, [user]);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    toast.success("Coupon code copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const isExpired = (expiry: string | null) => expiry ? new Date(expiry) < new Date() : false;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        <PageHeaderDecor />
        <VineBorder side="left" />
        <VineBorder side="right" />
        <div className="container relative mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">My Coupons</h1>
                <p className="text-muted-foreground">Your redeemed eco rewards</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/coupons">Browse More Coupons</Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-48 p-6" />
                </Card>
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Ticket className="mx-auto h-12 w-12 mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground mb-4">You haven't redeemed any coupons yet.</p>
                <Button asChild>
                  <Link to="/coupons">Browse Coupons</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map((uc) => {
                const expired = isExpired(uc.coupon?.expiry_date ?? null);
                return (
                  <Card
                    key={uc.id}
                    className={`overflow-hidden border-2 transition-all ${
                      expired ? "border-border opacity-70" : "border-primary/30"
                    }`}
                  >
                    <CardHeader className="pb-3 bg-primary/5">
                      <div className="flex items-center justify-between">
                        <span className="text-4xl">{uc.coupon?.icon ?? "🎟️"}</span>
                        <div className="flex flex-col items-end gap-1">
                          {expired ? (
                            <Badge variant="secondary" className="text-xs">Expired</Badge>
                          ) : (
                            <Badge variant="outline" className="border-primary/40 text-primary text-xs">Active</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">-{uc.points_spent} pts</span>
                        </div>
                      </div>
                      <CardTitle className="font-display text-lg mt-2">{uc.coupon?.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {uc.coupon?.description && (
                        <p className="text-sm text-muted-foreground">{uc.coupon.description}</p>
                      )}

                      {/* Coupon Code Display */}
                      <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Coupon Code</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-lg font-bold text-primary tracking-widest">
                            {uc.coupon?.coupon_code}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={() => copyCode(uc.coupon?.coupon_code ?? "", uc.id)}
                          >
                            {copied === uc.id ? (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-primary" />
                          <span>Redeemed on {new Date(uc.redeemed_at).toLocaleDateString()}</span>
                        </div>
                        {uc.coupon?.expiry_date && (
                          <div className="flex items-center gap-1.5">
                            <Clock className={`h-3.5 w-3.5 ${expired ? "text-destructive" : "text-muted-foreground"}`} />
                            <span className={expired ? "text-destructive" : ""}>
                              {expired ? "Expired" : "Valid until"} {new Date(uc.coupon.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
