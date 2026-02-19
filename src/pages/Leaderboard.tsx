import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import { PageHeaderDecor, VineBorder, LeafSVG } from "@/components/NatureDecorations";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [filter, setFilter] = useState("all");
  const [userBadges, setUserBadges] = useState<Record<string, any[]>>({});
  const [badgeMap, setBadgeMap] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: badges }, { data: ub }] = await Promise.all([
        supabase.from("profiles").select("*").order("points", { ascending: false }).limit(50),
        supabase.from("badges" as any).select("*"),
        supabase.from("user_badges" as any).select("user_id, badge_id"),
      ]);
      if (profiles) setLeaders(profiles);
      if (badges) {
        const map: Record<string, any> = {};
        (badges as any[]).forEach((b: any) => { map[b.id] = b; });
        setBadgeMap(map);
      }
      if (ub) {
        const grouped: Record<string, any[]> = {};
        (ub as any[]).forEach((entry: any) => {
          if (!grouped[entry.user_id]) grouped[entry.user_id] = [];
          grouped[entry.user_id].push(entry.badge_id);
        });
        setUserBadges(grouped);
      }
    })();
  }, []);

  const filteredLeaders = leaders;

  const getBadgeIcons = (userId: string) => {
    const ids = userBadges[userId] || [];
    return ids.slice(0, 3).map((id) => badgeMap[id]?.icon || "🏅");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        <PageHeaderDecor />
        <VineBorder side="left" />
        <VineBorder side="right" />

        <div className="container relative mx-auto max-w-3xl px-4 py-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
              <p className="text-muted-foreground">Top eco-warriors ranked by impact points.</p>
            </div>
          </div>

          <Tabs value={filter} onValueChange={setFilter} className="mt-6">
            <TabsList>
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Top 3 podium */}
          {filteredLeaders.length >= 3 && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[1, 0, 2].map((idx) => {
                const p = filteredLeaders[idx];
                const isCenter = idx === 0;
                const icons = getBadgeIcons(p.user_id);
                return (
                  <div key={p.id} className={`flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-lg hover:shadow-primary/5 ${isCenter ? "scale-105 border-primary/30 shadow-md shadow-primary/10" : ""}`}>
                    <span className="text-3xl">{RANK_ICONS[idx]}</span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
                      {p.name ? p.name[0].toUpperCase() : "?"}
                    </div>
                    <p className="text-sm font-semibold text-center">{p.name || "Anonymous"}</p>
                    {icons.length > 0 && (
                      <div className="flex gap-0.5 text-sm">{icons.map((ic, i) => <span key={i}>{ic}</span>)}</div>
                    )}
                    <p className="font-display text-xl font-bold text-primary">{p.points} <span className="text-xs text-muted-foreground">pts</span></p>
                  </div>
                );
              })}
            </div>
          )}

          <Card className="mt-6 overflow-hidden">
            <CardContent className="p-0">
              {filteredLeaders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <span className="text-4xl">🌱</span>
                  <p className="text-muted-foreground">No data yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredLeaders.slice(3).map((p, i) => {
                    const rank = i + 4;
                    const isMe = user && p.user_id === user.id;
                    const icons = getBadgeIcons(p.user_id);
                    return (
                      <div key={p.id} className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/30 ${isMe ? "bg-primary/5" : ""}`}>
                        <div className="flex h-8 w-8 items-center justify-center font-display text-sm font-bold text-muted-foreground">{rank}</div>
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                          {p.name ? p.name[0].toUpperCase() : "?"}
                          <LeafSVG className="absolute -right-1 -top-1 h-5 w-5 rotate-45 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {p.name || "Anonymous"} {isMe && <span className="text-xs text-primary">(You)</span>}
                            {icons.length > 0 && <span className="ml-2 text-sm">{icons.join("")}</span>}
                          </p>
                        </div>
                        <span className="font-display text-lg font-bold text-primary">{p.points}</span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
