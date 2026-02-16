import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { PageHeaderDecor, BranchSVG, LeafSVG } from "@/components/NatureDecorations";
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
    toast({ title: "Joined event! 🎉" });
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
      <div className="relative">
        <PageHeaderDecor />
        <BranchSVG className="pointer-events-none absolute right-0 top-40 h-16 w-56 text-eco-leaf" />

        <div className="container relative mx-auto px-4 py-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div>
              <h1 className="font-display text-3xl font-bold">Events</h1>
              <p className="text-muted-foreground">Join upcoming environmental events in your community.</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-12 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : events.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <span className="text-5xl">🌻</span>
              <p className="text-muted-foreground">No events yet. Check back soon!</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((e, i) => (
                <Card key={e.id} className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5">
                  <LeafSVG className={`pointer-events-none absolute -right-4 -top-4 h-20 w-20 text-primary transition-opacity ${i % 2 === 0 ? "rotate-12" : "-rotate-[30deg]"}`} />
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
                        <Button size="sm" className="shadow-sm shadow-primary/10" onClick={() => handleJoin(e.id)}>Join Event</Button>
                      )
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
