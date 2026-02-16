import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MapPin, Upload, Leaf, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeaderDecor, FloatingLeaves, TreeSVG } from "@/components/NatureDecorations";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";
import type { Database } from "@/integrations/supabase/types";

type ActivityType = Database["public"]["Enums"]["activity_type"];

type VerificationResult = {
  match: boolean;
  confidence: number;
  reason: string;
};

const TYPES: { value: ActivityType; label: string; points: number }[] = [
  { value: "tree_plantation", label: "🌳 Tree Plantation", points: 50 },
  { value: "cleanup", label: "🧹 Cleanup Drive", points: 30 },
  { value: "recycling", label: "♻️ Recycling", points: 20 },
  { value: "eco_habit", label: "🌿 Eco-Friendly Habit", points: 5 },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SubmitActivity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<ActivityType>("tree_plantation");
  const [description, setDescription] = useState("");
  const [wasteKg, setWasteKg] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { address, loading: addressLoading } = useReverseGeocode(lat, lng);

  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const verifyAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocLoading(false); },
      () => setLocLoading(false)
    );
  }, []);

  // Re-verify when activity type changes and an image is already selected
  useEffect(() => {
    if (image) {
      verifyImage(image, type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function verifyImage(file: File, activityType: ActivityType) {
    // Cancel any in-flight verification
    verifyAbort.current?.abort();
    const controller = new AbortController();
    verifyAbort.current = controller;

    setVerifying(true);
    setVerificationResult(null);

    try {
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke("verify-activity-image", {
        body: { imageBase64: base64, activityType },
      });

      if (controller.signal.aborted) return;

      if (error) {
        console.error("Verification error:", error);
        // Allow submission on error — admin will review
        setVerificationResult({ match: true, confidence: 0, reason: "Verification unavailable — you can still submit." });
      } else {
        setVerificationResult(data as VerificationResult);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Verification failed:", err);
      setVerificationResult({ match: true, confidence: 0, reason: "Verification unavailable — you can still submit." });
    } finally {
      if (!controller.signal.aborted) setVerifying(false);
    }
  }

  function handleImageChange(file: File | null) {
    setImage(file);
    setVerificationResult(null);
    if (file) {
      verifyImage(file, type);
    }
  }

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
        waste_kg: type === "cleanup" && wasteKg ? parseFloat(wasteKg) : null,
      } as any);
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
      <div className="relative">
        <PageHeaderDecor />
        <FloatingLeaves />
        <TreeSVG className="pointer-events-none absolute bottom-0 left-[2%] h-48 w-48 text-primary" />

        <div className="container relative mx-auto max-w-2xl px-4 py-8">
          <Card className="overflow-hidden">
            <CardHeader className="relative">
              <div className="absolute -right-6 -top-6 text-7xl opacity-[0.04]">🌳</div>
              <CardTitle className="font-display text-2xl flex items-center gap-2"><Leaf className="h-6 w-6 text-primary" /> Submit Activity</CardTitle>
              <CardDescription>Record your environmental contribution. An organizer will verify it.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Activity Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`rounded-lg border-2 p-3 text-left text-sm transition-all hover:scale-[1.02] ${
                          type === t.value ? "border-primary bg-primary/10 shadow-sm shadow-primary/10" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium">{t.label}</div>
                        <div className="text-xs text-muted-foreground">+{t.points} points</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Description (optional)</Label>
                  <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you do?" />
                </div>

                {type === "cleanup" && (
                  <div className="space-y-2">
                    <Label htmlFor="wasteKg">Waste Collected (kg)</Label>
                    <Input
                      id="wasteKg"
                      type="number"
                      min="0"
                      step="0.1"
                      value={wasteKg}
                      onChange={(e) => setWasteKg(e.target.value)}
                      placeholder="e.g. 5.5"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Photo Evidence</Label>
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-all hover:border-primary/50 hover:bg-primary/[0.02]">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{image ? image.name : "Click to upload an image"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)} />
                  </label>
                </div>

                {/* AI Verification Status */}
                {verifying && (
                  <Alert className="border-primary/30 bg-primary/5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <AlertDescription className="flex items-center gap-2">
                      Verifying image with AI...
                    </AlertDescription>
                  </Alert>
                )}

                {verificationResult && !verifying && (
                  verificationResult.match ? (
                    <Alert className="border-green-500/30 bg-green-500/5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="flex items-center gap-2 text-green-700">
                        {verificationResult.reason}
                        {verificationResult.confidence > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {Math.round(verificationResult.confidence * 100)}% confident
                          </Badge>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-destructive/30 bg-destructive/5">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        <p>{verificationResult.reason}</p>
                        {verificationResult.confidence > 0 && verificationResult.confidence < 0.5 ? (
                          <p className="mt-1 text-xs font-medium">
                            ⚠️ AI confidence is below 50%. Please upload a different photo that clearly shows the activity.
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            You can still submit — an organizer will review it.
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )
                )}

                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Location</Label>
                  {locLoading ? (
                    <p className="text-sm text-muted-foreground">Detecting location...</p>
                  ) : lat && lng ? (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</p>
                      {addressLoading ? (
                        <p className="text-xs text-muted-foreground">Resolving address...</p>
                      ) : address ? (
                        <p className="text-xs text-foreground/70">🏠 {address}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">Location unavailable. Please allow location access.</p>
                  )}
                </div>

                <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={submitting || verifying || (verificationResult !== null && verificationResult.confidence > 0 && verificationResult.confidence < 0.5)}>
                  {submitting ? "Submitting..." : `Submit ${selected.label}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
