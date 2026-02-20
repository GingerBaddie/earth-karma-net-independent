import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { PageHeaderDecor, VineBorder } from "@/components/NatureDecorations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Ticket, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

type Coupon = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  points_cost: number;
  coupon_code: string;
  expiry_date: string | null;
  max_redemptions: number | null;
  total_redeemed: number;
  is_active: boolean;
};

export default function Coupons() {
  const { profile, user, refreshProfile } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    const [couponRes, redeemedRes] = await Promise.all([
      supabase.from("coupons" as any).select("*").eq("is_active", true).order("points_cost"),
      supabase.from("user_coupons" as any).select("coupon_id").eq("user_id", user.id),
    ]);
    if (couponRes.data) setCoupons(couponRes.data as unknown as Coupon[]);
    if (redeemedRes.data) setRedeemedIds((redeemedRes.data as any[]).map((r) => r.coupon_id));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRedeem = async (coupon: Coupon) => {
    if (!user) return;
    setRedeeming(coupon.id);
    try {
      const { error } = await supabase.rpc("redeem_coupon" as any, { p_coupon_id: coupon.id });
      if (error) throw error;
      toast.success(`🎉 Coupon redeemed! Code: ${coupon.coupon_code}`, { duration: 6000 });
      await Promise.all([fetchData(), refreshProfile()]);
    } catch (err: any) {
      toast.error(err.message || "Failed to redeem coupon");
    } finally {
      setRedeeming(null);
    }
  };

  const points = profile?.points ?? 0;

  const isExpired = (expiry: string | null) => expiry ? new Date(expiry) < new Date() : false;
  const isSoldOut = (c: Coupon) => c.max_redemptions !== null && c.total_redeemed >= c.max_redemptions;

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
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Redeem Coupons</h1>
                <p className="text-muted-foreground">Spend your eco points on exclusive rewards</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Card className="border-primary/30">
                <CardContent className="flex items-center gap-2 p-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-bold text-primary">{points} pts</span>
                  <span className="text-xs text-muted-foreground">available</span>
                </CardContent>
              </Card>
              <Button variant="outline" asChild>
                <Link to="/my-coupons">My Coupons</Link>
              </Button>
            </div>
          </div>

          {/* Coupons Grid */}
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
              <CardContent className="py-16 text-center text-muted-foreground">
                <Ticket className="mx-auto h-12 w-12 mb-3 opacity-30" />
                <p>No coupons available right now. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map((c) => {
                const redeemed = redeemedIds.includes(c.id);
                const expired = isExpired(c.expiry_date);
                const soldOut = isSoldOut(c);
                const canAfford = points >= c.points_cost;
                const unavailable = redeemed || expired || soldOut;

                return (
                  <Card
                    key={c.id}
                    className={`relative overflow-hidden transition-all hover:shadow-md ${
                      unavailable ? "opacity-60" : "hover:shadow-primary/10 hover:-translate-y-0.5"
                    }`}
                  >
                    {redeemed && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2 text-primary">
                          <CheckCircle className="h-10 w-10" />
                          <span className="font-bold text-sm">Redeemed</span>
                        </div>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <span className="text-5xl">{c.icon}</span>
                        <div className="flex flex-col items-end gap-1">
                          {expired && <Badge variant="destructive" className="text-xs">Expired</Badge>}
                          {soldOut && !expired && <Badge variant="secondary" className="text-xs">Sold Out</Badge>}
                          {!expired && !soldOut && (
                            <Badge variant="outline" className="border-primary/40 text-primary text-xs font-bold">
                              {c.points_cost} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="font-display text-lg mt-2">{c.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {c.description && (
                        <p className="text-sm text-muted-foreground">{c.description}</p>
                      )}
                      {c.expiry_date && !expired && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Expires {new Date(c.expiry_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {c.max_redemptions && (
                        <div className="text-xs text-muted-foreground">
                          {c.total_redeemed}/{c.max_redemptions} redeemed
                        </div>
                      )}
                      <Button
                        className="w-full"
                        disabled={unavailable || !canAfford || redeeming === c.id}
                        onClick={() => handleRedeem(c)}
                        variant={canAfford && !unavailable ? "default" : "outline"}
                      >
                        {redeeming === c.id
                          ? "Redeeming…"
                          : redeemed
                          ? "Already Redeemed"
                          : expired
                          ? "Expired"
                          : soldOut
                          ? "Sold Out"
                          : !canAfford
                          ? `Need ${c.points_cost - points} more pts`
                          : "Redeem Now"}
                      </Button>
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
