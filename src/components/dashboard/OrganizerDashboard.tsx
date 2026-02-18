import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, Plus, ArrowRight } from "lucide-react";
import { LeafSVG } from "@/components/NatureDecorations";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];

const TYPE_LABELS: Record<string, string> = {
  tree_plantation: "🌳 Tree Plantation",
  cleanup: "🧹 Cleanup Drive",
  recycling: "♻️ Recycling",
  eco_habit: "🌿 Eco Habit",
};

export default function OrganizerDashboard() {
  const { profile, user } = useAuth();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [eventsRes, participantsRes] = await Promise.all([
        supabase.from("events").select("*").eq("created_by", user.id).order("event_date", { ascending: false }),
        supabase.from("event_participants").select("event_id, events!inner(created_by)").eq("events.created_by", user.id),
      ]);
      setMyEvents(eventsRes.data || []);
      setTotalParticipants(participantsRes.data?.length || 0);
    })();
  }, [user]);

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <Badge className="bg-accent text-accent-foreground">Organizer</Badge>
          </div>
          <p className="text-muted-foreground">Welcome back, {profile?.name || "Organizer"}! 🌿</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="group overflow-hidden transition-shadow hover:shadow-md hover:shadow-primary/5">
          <CardContent className="relative flex items-center gap-4 p-5">
            <LeafSVG className="absolute -right-4 -top-4 h-20 w-20 rotate-45 text-primary opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">My Events</p><p className="font-display text-2xl font-bold">{myEvents.length}</p></div>
          </CardContent>
        </Card>
        <Card className="group overflow-hidden transition-shadow hover:shadow-md hover:shadow-eco-gold/5">
          <CardContent className="relative flex items-center gap-4 p-5">
            <LeafSVG className="absolute -right-4 -top-4 h-20 w-20 rotate-12 text-eco-gold opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-eco-gold/10 text-eco-gold"><Users className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Total Participants</p><p className="font-display text-2xl font-bold">{totalParticipants}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* My Events */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">📅 My Events</CardTitle>
          <Button asChild size="sm">
            <Link to="/admin"><Plus className="mr-1 h-4 w-4" /> Create Event</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {myEvents.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">You haven't created any events yet</p>
          ) : (
            <div className="space-y-3">
              {myEvents.slice(0, 8).map((e) => (
                <Link key={e.id} to={`/events/${e.id}`} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString()} · {e.location || "No location"}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick link */}
      <div className="mt-6 flex justify-center">
        <Button asChild variant="outline" size="lg">
          <Link to="/admin"><ArrowRight className="mr-2 h-4 w-4" /> Open Admin Panel</Link>
        </Button>
      </div>
    </>
  );
}
