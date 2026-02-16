import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const RANK_STYLES = ["text-yellow-500", "text-gray-400", "text-amber-700"];

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").order("points", { ascending: false }).limit(50);
      if (data) setLeaders(data);
    })();
  }, []);

  // Simple filter simulation (all-time by default)
  const filteredLeaders = leaders;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-muted-foreground">Top eco-warriors ranked by impact points.</p>

        <Tabs value={filter} onValueChange={setFilter} className="mt-6">
          <TabsList>
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="mt-4">
          <CardContent className="p-0">
            {filteredLeaders.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">No data yet</p>
            ) : (
              <div className="divide-y">
                {filteredLeaders.map((p, i) => {
                  const isMe = user && p.user_id === user.id;
                  return (
                    <div key={p.id} className={`flex items-center gap-4 px-5 py-4 ${isMe ? "bg-primary/5" : ""}`}>
                      <div className="flex h-8 w-8 items-center justify-center font-display text-lg font-bold">
                        {i < 3 ? <Trophy className={`h-5 w-5 ${RANK_STYLES[i]}`} /> : <span className="text-muted-foreground">{i + 1}</span>}
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                        {p.name ? p.name[0].toUpperCase() : "?"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.name || "Anonymous"} {isMe && <span className="text-xs text-primary">(You)</span>}</p>
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
  );
}
