import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { MapPin, Upload, Leaf } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ActivityType = Database["public"]["Enums"]["activity_type"];

const TYPES: { value: ActivityType; label: string; points: number }[] = [
  { value: "tree_plantation", label: "🌳 Tree Plantation", points: 50 },
  { value: "cleanup", label: "🧹 Cleanup Drive", points: 30 },
  { value: "recycling", label: "♻️ Recycling", points: 20 },
  { value: "eco_habit", label: "🌿 Eco-Friendly Habit", points: 5 },
];

export default function SubmitActivity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<ActivityType>("tree_plantation");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocLoading(false); },
      () => setLocLoading(false)
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (image) {
        const ext = image.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("activity-images").upload(path, image);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("activity-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("activities").insert({
        user_id: user.id,
        type,
        description: description || null,
        image_url,
        latitude: lat,
        longitude: lng,
      });
      if (error) throw error;

      toast({ title: "Activity submitted!", description: "Your activity is pending review." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const selected = TYPES.find((t) => t.value === type)!;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl flex items-center gap-2"><Leaf className="h-6 w-6 text-primary" /> Submit Activity</CardTitle>
            <CardDescription>Record your environmental contribution. An organizer will verify it.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type selection */}
              <div className="space-y-2">
                <Label>Activity Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                        type === t.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">+{t.points} points</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you do?" />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label>Photo Evidence</Label>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{image ? image.name : "Click to upload an image"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              {/* Geo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Location</Label>
                {locLoading ? (
                  <p className="text-sm text-muted-foreground">Detecting location...</p>
                ) : lat && lng ? (
                  <p className="text-sm text-muted-foreground">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</p>
                ) : (
                  <p className="text-sm text-destructive">Location unavailable. Please allow location access.</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : `Submit ${selected.label}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
