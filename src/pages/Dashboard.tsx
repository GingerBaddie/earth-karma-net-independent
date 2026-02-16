import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Award, TrendingUp, Leaf, Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Activity = Database["public"]["Tables"]["activities"]["Row"];
type Reward = Database["public"]["Tables"]["rewards"]["Row"];

const STATUS_COLORS: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800" };
const TYPE_LABELS: Record<string, string> = { tree_plantation: "🌳 Tree Plantation", cleanup: "🧹 Cleanup Drive", recycling: "♻️ Recycling", eco_habit: "🌿 Eco Habit" };
const PIE_COLORS = ["hsl(152,55%,33%)", "hsl(85,45%,50%)", "hsl(200,60%,55%)", "hsl(45,90%,55%)"];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [actRes, rewRes, urRes] = await Promise.all([
        supabase.from("activities").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("rewards").select("*").order("points_required"),
        supabase.from("user_rewards").select("reward_id").eq("user_id", user.id),
      ]);
      if (actRes.data) setActivities(actRes.data);
      if (rewRes.data) setRewards(rewRes.data);
      if (urRes.data) setUnlockedIds(urRes.data.map((r) => r.reward_id));
    })();
  }, [user]);

  const points = profile?.points ?? 0;
  const nextReward = rewards.find((r) => r.points_required > points);
  const progress = nextReward ? Math.min((points / nextReward.points_required) * 100, 100) : 100;

  // Monthly chart data
  const monthlyData = activities.filter((a) => a.status === "approved").reduce((acc, a) => {
    const month = new Date(a.created_at).toLocaleString("default", { month: "short" });
    const existing = acc.find((d) => d.month === month);
    if (existing) existing.count++;
    else acc.push({ month, count: 1 });
    return acc;
  }, [] as { month: string; count: number }[]);

  // Type breakdown
  const typeData = activities.filter((a) => a.status === "approved").reduce((acc, a) => {
    const existing = acc.find((d) => d.name === TYPE_LABELS[a.type]);
    if (existing) existing.value++;
    else acc.push({ name: TYPE_LABELS[a.type], value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, {profile?.name || "Eco Warrior"}!</p>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><TrendingUp className="h-6 w-6" /></div>
              <div><p className="text-sm text-muted-foreground">Total Points</p><p className="font-display text-2xl font-bold">{points}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent"><Leaf className="h-6 w-6" /></div>
              <div><p className="text-sm text-muted-foreground">Activities</p><p className="font-display text-2xl font-bold">{activities.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-eco-gold/10 text-eco-gold"><Award className="h-6 w-6" /></div>
              <div><p className="text-sm text-muted-foreground">Rewards</p><p className="font-display text-2xl font-bold">{unlockedIds.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-eco-sky/10 text-eco-sky"><Clock className="h-6 w-6" /></div>
              <div><p className="text-sm text-muted-foreground">Pending</p><p className="font-display text-2xl font-bold">{activities.filter((a) => a.status === "pending").length}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Progress to next reward */}
        {nextReward && (
          <Card className="mt-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next reward: <strong className="text-foreground">{nextReward.icon} {nextReward.name}</strong></span>
                <span className="text-muted-foreground">{points}/{nextReward.points_required} pts</span>
              </div>
              <Progress value={progress} className="mt-2 h-3" />
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Monthly Activity</CardTitle></CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,88%)" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(152,55%,33%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="py-12 text-center text-muted-foreground">No approved activities yet</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Activity Breakdown</CardTitle></CardHeader>
            <CardContent>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name }) => name}>
                      {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="py-12 text-center text-muted-foreground">No data to display</p>}
            </CardContent>
          </Card>
        </div>

        {/* Rewards */}
        <Card className="mt-6">
          <CardHeader><CardTitle className="font-display text-lg">Rewards</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {rewards.map((r) => {
                const unlocked = unlockedIds.includes(r.id);
                return (
                  <div key={r.id} className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-center transition-colors ${unlocked ? "border-primary bg-primary/5" : "opacity-40"}`}>
                    <span className="text-3xl">{r.icon}</span>
                    <span className="text-xs font-semibold">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{r.points_required} pts</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent activities */}
        <Card className="mt-6">
          <CardHeader><CardTitle className="font-display text-lg">Recent Activities</CardTitle></CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No activities yet. Start by submitting one!</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{TYPE_LABELS[a.type]}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.points_awarded > 0 && <span className="text-sm font-semibold text-primary">+{a.points_awarded} pts</span>}
                      <Badge variant="secondary" className={STATUS_COLORS[a.status]}>{a.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
