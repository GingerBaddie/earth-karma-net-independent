import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<(Event & { participant_count: number; joined: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    const { data: eventsData } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    if (!eventsData) { setLoading(false); return; }

    const { data: participants } = await supabase.from("event_participants").select("event_id, user_id");

    const enriched = eventsData.map((e) => {
      const eps = (participants ?? []).filter((p) => p.event_id === e.id);
      return { ...e, participant_count: eps.length, joined: user ? eps.some((p) => p.user_id === user.id) : false };
    });
    setEvents(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [user]);

  const handleJoin = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.from("event_participants").insert({ event_id: eventId, user_id: user.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Joined event!" });
    fetchEvents();
  };

  const handleLeave = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.from("event_participants").delete().eq("event_id", eventId).eq("user_id", user.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Left event" });
    fetchEvents();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold">Events</h1>
        <p className="mt-1 text-muted-foreground">Join upcoming environmental events in your community.</p>

        {loading ? (
          <div className="mt-12 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : events.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">No events yet. Check back soon!</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Card key={e.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-display text-lg">{e.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {e.description && <p className="text-foreground">{e.description}</p>}
                    <div className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {new Date(e.event_date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</div>
                    {e.location && <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {e.location}</div>}
                    <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {e.participant_count} participant{e.participant_count !== 1 ? "s" : ""}</div>
                  </div>
                  {user && (
                    e.joined ? (
                      <Button variant="outline" size="sm" onClick={() => handleLeave(e.id)}>Leave Event</Button>
                    ) : (
                      <Button size="sm" onClick={() => handleJoin(e.id)}>Join Event</Button>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
