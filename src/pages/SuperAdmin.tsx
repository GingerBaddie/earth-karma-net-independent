import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, CalendarDays, Activity, BarChart3, Search, Trash2, Shield, Ban, ShieldAlert, ShieldCheck } from "lucide-react";
import { PageHeaderDecor } from "@/components/NatureDecorations";
import type { Database } from "@/integrations/supabase/types";
type Profile = Database["public"]["Tables"]["profiles"]["Row"] & { account_status?: string };
type Event = Database["public"]["Tables"]["events"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];

const TYPE_LABELS: Record<string, string> = {
  tree_plantation: "🌳 Tree Plantation",
  cleanup: "🧹 Cleanup",
  recycling: "♻️ Recycling",
  eco_habit: "🌿 Eco Habit",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const PIE_COLORS = ["hsl(152,55%,33%)", "hsl(200,60%,45%)", "hsl(45,80%,50%)", "hsl(340,60%,50%)"];

export default function SuperAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");

  const [profiles, setProfiles] = useState<(Profile & { role?: string })[]>([]);
  const [events, setEvents] = useState<(Event & { participant_count?: number; creator_name?: string })[]>([]);
  const [activities, setActivities] = useState<(ActivityRow & { profile_name?: string })[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalEvents: 0, totalActivities: 0, totalPoints: 0 });
  const [activityByType, setActivityByType] = useState<{ type: string; count: number }[]>([]);
  const [activityByStatus, setActivityByStatus] = useState<{ status: string; count: number }[]>([]);

  const fetchAll = async () => {
    // Profiles + roles
    const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (profs) {
      const enriched = profs.map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.user_id)?.role || "citizen",
      }));
      setProfiles(enriched);
      setStats((s) => ({ ...s, totalUsers: profs.length, totalPoints: profs.reduce((sum, p) => sum + p.points, 0) }));
    }

    // Events with participant counts
    const { data: evts } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    if (evts) {
      const { data: participants } = await supabase.from("event_participants").select("event_id");
      const enriched = evts.map((e) => ({
        ...e,
        participant_count: participants?.filter((p) => p.event_id === e.id).length || 0,
        creator_name: profs?.find((p) => p.user_id === e.created_by)?.name || "Unknown",
      }));
      setEvents(enriched);
      setStats((s) => ({ ...s, totalEvents: evts.length }));
    }

    // Activities
    const { data: acts } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
    if (acts) {
      const enriched = acts.map((a) => ({
        ...a,
        profile_name: profs?.find((p) => p.user_id === a.user_id)?.name || "Unknown",
      }));
      setActivities(enriched);
      setStats((s) => ({ ...s, totalActivities: acts.length }));

      // By type
      const byType = acts.reduce((acc, a) => {
        const label = TYPE_LABELS[a.type] || a.type;
        const existing = acc.find((d) => d.type === label);
        if (existing) existing.count++;
        else acc.push({ type: label, count: 1 });
        return acc;
      }, [] as { type: string; count: number }[]);
      setActivityByType(byType);

      // By status
      const byStatus = acts.reduce((acc, a) => {
        const existing = acc.find((d) => d.status === a.status);
        if (existing) existing.count++;
        else acc.push({ status: a.status, count: 1 });
        return acc;
      }, [] as { status: string; count: number }[]);
      setActivityByStatus(byStatus);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Event deleted" });
    fetchAll();
  };

  const [statusDialog, setStatusDialog] = useState<{ open: boolean; userId: string; name: string; currentStatus: string }>({
    open: false, userId: "", name: "", currentStatus: "active",
  });
  const [newStatus, setNewStatus] = useState<string>("active");
  const [statusLoading, setStatusLoading] = useState(false);

  const handleChangeStatus = async () => {
    setStatusLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("manage-user-status", {
        body: { user_id: statusDialog.userId, status: newStatus },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: `User ${newStatus === "banned" ? "banned" : newStatus === "suspended" ? "suspended" : "reactivated"} successfully` });
      setStatusDialog({ open: false, userId: "", name: "", currentStatus: "active" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setStatusLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase()) || p.role?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = events.filter(
    (e) => e.title.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredActivities = activities.filter(
    (a) => a.profile_name?.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()) || a.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        <PageHeaderDecor />
        <div className="container relative mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-7 w-7 text-primary" />
            <div>
              <h1 className="font-display text-3xl font-bold">Super Admin</h1>
              <p className="text-muted-foreground">Full system overview and management.</p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <CalendarDays className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                  <p className="text-xs text-muted-foreground">Total Events</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalActivities}</p>
                  <p className="text-xs text-muted-foreground">Total Activities</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Points Distributed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <div className="mt-4 mb-4">
              {tab !== "analytics" && (
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
            </div>

            <TabsContent value="users">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((p) => {
                        const accStatus = (p as any).account_status || "active";
                        return (
                          <TableRow key={p.id} className={accStatus === "banned" ? "opacity-50" : ""}>
                            <TableCell className="font-medium">{p.name || "—"}</TableCell>
                            <TableCell>{p.city || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={p.role === "admin" ? "default" : p.role === "organizer" ? "secondary" : "outline"}>
                                {p.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={accStatus === "active" ? "outline" : "destructive"} className={
                                accStatus === "active" ? "border-green-500 text-green-700" :
                                accStatus === "suspended" ? "bg-yellow-500/10 text-yellow-700 border-yellow-500" : ""
                              }>
                                {accStatus === "active" && <ShieldCheck className="mr-1 h-3 w-3" />}
                                {accStatus === "suspended" && <ShieldAlert className="mr-1 h-3 w-3" />}
                                {accStatus === "banned" && <Ban className="mr-1 h-3 w-3" />}
                                {accStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{p.points}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {p.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setStatusDialog({ open: true, userId: p.user_id, name: p.name, currentStatus: accStatus });
                                    setNewStatus(accStatus);
                                  }}
                                >
                                  <Shield className="h-3 w-3 mr-1" /> Manage
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredProfiles.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.title}</TableCell>
                          <TableCell className="text-xs">{new Date(e.event_date).toLocaleDateString()}</TableCell>
                          <TableCell>{e.location || "—"}</TableCell>
                          <TableCell>{e.creator_name}</TableCell>
                          <TableCell>{e.participant_count}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(e.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredEvents.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No events found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivities.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.profile_name}</TableCell>
                          <TableCell>{TYPE_LABELS[a.type] || a.type}</TableCell>
                          <TableCell>
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] || ""}`}>
                              {a.status}
                            </span>
                          </TableCell>
                          <TableCell>{a.points_awarded}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {filteredActivities.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No activities found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="font-display text-lg">Activities by Type</CardTitle></CardHeader>
                  <CardContent>
                    {activityByType.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={activityByType}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,88%)" />
                          <XAxis dataKey="type" fontSize={11} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(152,55%,33%)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="py-12 text-center text-muted-foreground">No data yet</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="font-display text-lg">Activities by Status</CardTitle></CardHeader>
                  <CardContent>
                    {activityByStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={activityByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                            {activityByStatus.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="py-12 text-center text-muted-foreground">No data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* User Status Management Dialog */}
          <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog((s) => ({ ...s, open }))}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Account: {statusDialog.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Current status: <Badge variant="outline">{statusDialog.currentStatus}</Badge>
                </p>
                <div>
                  <label className="text-sm font-medium mb-2 block">Change status to:</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600" /> Active</span>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-yellow-600" /> Suspended (30 days)</span>
                      </SelectItem>
                      <SelectItem value="banned">
                        <span className="flex items-center gap-2"><Ban className="h-4 w-4 text-destructive" /> Banned (permanent)</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newStatus === "banned" && (
                  <p className="text-sm text-destructive">⚠️ This will permanently block the user from logging in.</p>
                )}
                {newStatus === "suspended" && (
                  <p className="text-sm text-yellow-600">⏳ The user will be unable to log in for 30 days.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusDialog((s) => ({ ...s, open: false }))}>Cancel</Button>
                <Button
                  variant={newStatus === "banned" ? "destructive" : "default"}
                  onClick={handleChangeStatus}
                  disabled={statusLoading || newStatus === statusDialog.currentStatus}
                >
                  {statusLoading ? "Updating..." : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
