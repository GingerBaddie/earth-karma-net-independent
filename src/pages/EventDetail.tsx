import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, MapPin, Users, ArrowLeft, QrCode, Camera, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { PageHeaderDecor, LeafSVG, FloatingLeaves } from "@/components/NatureDecorations";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [event, setEvent] = useState<(Event & { checkin_code?: string }) | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    // Use the public view (no checkin_code) for general event data
    const { data } = await supabase.from("events_public" as any).select("*").eq("id", id).maybeSingle() as { data: Event | null };
    if (data) {
      // If user is the event owner or admin, fetch checkin_code from the base table
      const isOwner = (role === "organizer" && data.created_by === user?.id) || role === "admin";
      let checkinCode: string | undefined;
      if (isOwner) {
        const { data: fullEvent } = await supabase.from("events").select("checkin_code").eq("id", id).maybeSingle();
        checkinCode = fullEvent?.checkin_code ?? undefined;
      }
      setEvent({ ...data, checkin_code: checkinCode });
    }

    const { data: participants } = await supabase
      .from("event_participants")
      .select("user_id")
      .eq("event_id", id);
    setParticipantCount(participants?.length ?? 0);
    if (user) {
      setJoined(participants?.some((p) => p.user_id === user.id) ?? false);
      const { data: checkin } = await supabase
        .from("event_checkins")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setCheckedIn(!!checkin);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const handleJoin = async () => {
    if (!user || !id) return;
    const { error } = await supabase.from("event_participants").insert({ event_id: id, user_id: user.id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Joined event! 🎉" });
    fetchEvent();
  };

  const handleLeave = async () => {
    if (!user || !id) return;
    const { error } = await supabase.from("event_participants").delete().eq("event_id", id).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Left event" });
    fetchEvent();
  };

  const startScanner = async () => {
    setScanning(true);
    // Wait for DOM element to mount
    await new Promise((r) => setTimeout(r, 300));
    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Parse QR data
          try {
            const data = JSON.parse(decodedText);
            if (data.event_id && data.code) {
              await scanner.stop();
              scannerRef.current = null;
              setScanning(false);
              await handleCheckin(data.event_id, data.code);
            }
          } catch {
            // Not our QR format, ignore
          }
        },
        () => {} // ignore errors during scanning
      );
    } catch (err: any) {
      toast({ title: "Camera Error", description: err?.message || "Could not access camera", variant: "destructive" });
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleCheckin = async (eventId: string, code: string) => {
    const { error } = await supabase.rpc("checkin_event", { p_event_id: eventId, p_code: code });
    if (error) {
      toast({ title: "Check-in Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Checked in successfully! 🌟", description: "Points have been awarded." });
    setCheckedIn(true);
    fetchEvent();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <span className="text-5xl">🔍</span>
          <p className="text-muted-foreground">Event not found</p>
          <Button asChild variant="outline"><Link to="/events">Back to Events</Link></Button>
        </div>
      </div>
    );
  }

  const isEventOwner = (role === "organizer" && event.created_by === user?.id) || role === "admin";
  const isOrganizer = role === "organizer" || role === "admin";
  const qrData = JSON.stringify({ event_id: event.id, code: event.checkin_code });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        <PageHeaderDecor />
        <FloatingLeaves />

        <div className="container relative mx-auto px-4 py-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/events"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Events</Link>
          </Button>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Event Info */}
            <div className="lg:col-span-2">
              <Card className="relative overflow-hidden">
                <LeafSVG className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rotate-12 text-primary" />
                <CardHeader>
                  <CardTitle className="font-display text-2xl">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.description && <p className="text-foreground">{event.description}</p>}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(event.event_date).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> {participantCount} participant{participantCount !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">🏆 {(event as any).attendance_points ?? 25} points for attendance</Badge>
                    {(event as any).event_type && (
                      <Badge variant="outline">
                        {{ tree_plantation: "🌳 Tree Plantation", cleanup: "🧹 Cleanup Drive", recycling: "♻️ Recycling", eco_habit: "🌿 Eco Habit" }[(event as any).event_type] || (event as any).event_type}
                      </Badge>
                    )}
                  </div>

                  {user && !isOrganizer && (
                    <div className="flex gap-3 pt-2">
                      {joined ? (
                        <Button variant="outline" onClick={handleLeave}>Leave Event</Button>
                      ) : (
                        <Button onClick={handleJoin} className="shadow-sm shadow-primary/10">Join Event</Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* QR / Check-in Section */}
            <div className="space-y-6">
              {/* Organizer: Show QR */}
              {isEventOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <QrCode className="h-5 w-5" /> Attendance QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    {showQR ? (
                      <>
                        <div className="rounded-xl border-4 border-primary/20 bg-white p-4">
                          <QRCodeSVG value={qrData} size={200} level="H" />
                        </div>
                        <p className="text-center text-xs text-muted-foreground">
                          Display this QR at the event location. Volunteers scan it to check in and earn points.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setShowQR(false)}>Hide QR</Button>
                      </>
                    ) : (
                      <>
                        <p className="text-center text-sm text-muted-foreground">
                          Generate a QR code for volunteers to scan at the event location.
                        </p>
                        <Button onClick={() => setShowQR(true)} className="shadow-sm shadow-primary/10">
                          <QrCode className="mr-2 h-4 w-4" /> Show QR Code
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Volunteer: Scan QR */}
              {user && !isOrganizer && joined && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <Camera className="h-5 w-5" /> Check In
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    {checkedIn ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <CheckCircle2 className="h-12 w-12 text-primary" />
                        <p className="font-medium text-primary">Already Checked In!</p>
                        <p className="text-center text-xs text-muted-foreground">
                          You've earned {(event as any).attendance_points ?? 25} points for this event.
                        </p>
                      </div>
                    ) : scanning ? (
                      <>
                        <div id={scannerContainerId} className="w-full overflow-hidden rounded-lg" />
                        <Button variant="outline" size="sm" onClick={stopScanner}>Cancel Scan</Button>
                      </>
                    ) : (
                      <>
                        <p className="text-center text-sm text-muted-foreground">
                          Scan the QR code at the event location to check in and earn points.
                        </p>
                        <Button onClick={startScanner} className="shadow-sm shadow-primary/10">
                          <Camera className="mr-2 h-4 w-4" /> Scan QR Code
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Not logged in */}
              {!user && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Log in to join events and check in.</p>
                    <Button asChild className="mt-3"><Link to="/login">Log In</Link></Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
