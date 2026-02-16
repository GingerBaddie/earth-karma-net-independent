import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, CheckCircle2 } from "lucide-react";

interface CheckinRow {
  id: string;
  checked_in_at: string;
  points_awarded: number;
  event_id: string;
  events: {
    title: string;
    event_date: string;
    location: string | null;
  } | null;
}

export default function CheckinHistory({ userId }: { userId: string }) {
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("event_checkins")
        .select("id, checked_in_at, points_awarded, event_id, events(title, event_date, location)")
        .eq("user_id", userId)
        .order("checked_in_at", { ascending: false })
        .limit(20);
      if (data) setCheckins(data as unknown as CheckinRow[]);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8 text-center text-muted-foreground">Loading check-in history...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" /> Event Check-in History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checkins.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No event check-ins yet. Join an event and scan the QR code to check in! 📸
          </p>
        ) : (
          <div className="space-y-3">
            {checkins.map((c) => (
              <Link
                key={c.id}
                to={`/events/${c.event_id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-secondary/30"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{c.events?.title ?? "Unknown Event"}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(c.checked_in_at).toLocaleDateString()}
                    </span>
                    {c.events?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {c.events.location}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  +{c.points_awarded} pts
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
