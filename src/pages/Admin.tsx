import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle, XCircle, CalendarPlus, BarChart3 } from "lucide-react";
import { PageHeaderDecor, BranchSVG } from "@/components/NatureDecorations";
import LocationPicker from "@/components/admin/LocationPicker";
import type { Database } from "@/integrations/supabase/types";

type Activity = Database["public"]["Tables"]["activities"]["Row"];
type Event = Database["public"]["Tables"]["events"]["Row"];

const TYPE_LABELS: Record<string, string> = { tree_plantation: "🌳 Tree Plantation", cleanup: "🧹 Cleanup", recycling: "♻️ Recycling", eco_habit: "🌿 Eco Habit" };

export default function Admin() {
  const { user } = useAuth();
  const [pending, setPending] = useState<(Activity & { profile_name?: string })[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [analytics, setAnalytics] = useState<{ type: string; count: number }[]>([]);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", location: "", event_date: "" });
  const [eventLat, setEventLat] = useState<number | null>(null);
  const [eventLng, setEventLng] = useState<number | null>(null);
  const [tab, setTab] = useState("pending");

  const fetchData = async () => {
    const { data: acts } = await supabase.from("activities").select("*").eq("status", "pending").order("created_at", { ascending: false });
    if (acts) {
      const userIds = [...new Set(acts.map((a) => a.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
      const enriched = acts.map((a) => ({
        ...a,
        profile_name: profiles?.find((p) => p.user_id === a.user_id)?.name || "Unknown",
      }));
      setPending(enriched);
    }
    const { data: evts } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    if (evts) setEvents(evts);
    const { data: allActs } = await supabase.from("activities").select("type, status");
    if (allActs) {
      const approved = allActs.filter((a) => a.status === "approved");
      const grouped = approved.reduce((acc, a) => {
        const existing = acc.find((d) => d.type === TYPE_LABELS[a.type]);
        if (existing) existing.count++;
        else acc.push({ type: TYPE_LABELS[a.type], count: 1 });
        return acc;
      }, [] as { type: string; count: number }[]);
      setAnalytics(grouped);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id: string) => {
    const { error } = await supabase.rpc("approve_activity", { activity_id: id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Activity approved & points awarded! 🎉" });
    fetchData();
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from("activities").update({ status: "rejected", reviewed_by: user?.id }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Activity rejected" });
    fetchData();
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("events").insert({ ...newEvent, created_by: user.id, latitude: eventLat, longitude: eventLng });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Event created! 🌿" });
    setNewEvent({ title: "", description: "", location: "", event_date: "" });
    setEventLat(null);
    setEventLng(null);
    fetchData();
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Event deleted" });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        <PageHeaderDecor />
        <BranchSVG className="pointer-events-none absolute left-0 bottom-20 h-14 w-44 text-eco-leaf" />

        <div className="container relative mx-auto px-4 py-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <div>
              <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage activities, events, and view analytics.</p>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pending.length === 0 ? (
                <div className="mt-8 flex flex-col items-center gap-2 text-center">
                  <span className="text-4xl">🎉</span>
                  <p className="text-muted-foreground">No pending activities</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {pending.map((a) => (
                    <Card key={a.id} className="transition-shadow hover:shadow-md hover:shadow-primary/5">
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{TYPE_LABELS[a.type]}</p>
                            <Badge variant="secondary">{a.profile_name}</Badge>
                          </div>
                          {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.created_at).toLocaleString()}
                            {a.latitude && ` · 📍 ${a.latitude.toFixed(2)}, ${a.longitude?.toFixed(2)}`}
                          </p>
                          {a.image_url && (
                            <a href={a.image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              View Image →
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(a.id)}><CheckCircle className="mr-1 h-4 w-4" /> Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(a.id)}><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="events">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display"><CalendarPlus className="h-5 w-5" /> Create Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Title</Label><Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Date</Label><Input type="datetime-local" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} required /></div>
                    </div>
                    <div className="space-y-2"><Label>Description</Label><Input value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} /></div>
                    <LocationPicker
                      location={newEvent.location}
                      latitude={eventLat}
                      longitude={eventLng}
                      onLocationChange={(loc) => setNewEvent({ ...newEvent, location: loc })}
                      onCoordsChange={(lat, lng) => { setEventLat(lat); setEventLng(lng); }}
                    />
                    <Button type="submit" className="shadow-sm shadow-primary/10">Create Event</Button>
                  </form>
                </CardContent>
              </Card>
              <div className="mt-6 space-y-3">
                {events.map((e) => (
                  <Card key={e.id} className="transition-shadow hover:shadow-sm">
                    <CardContent className="flex items-center justify-between p-4">
                      <Link to={`/events/${e.id}`} className="flex-1">
                        <p className="font-medium hover:text-primary">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString()} · {e.location}</p>
                      </Link>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild><Link to={`/events/${e.id}`}>QR Code</Link></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(e.id)}>Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="mt-4">
                <CardHeader><CardTitle className="flex items-center gap-2 font-display"><BarChart3 className="h-5 w-5" /> Activity Analytics</CardTitle></CardHeader>
                <CardContent>
                  {analytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,88%)" />
                        <XAxis dataKey="type" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(152,55%,33%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="py-12 text-center text-muted-foreground">No approved activities yet</p>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
