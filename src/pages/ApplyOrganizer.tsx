import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { PageHeaderDecor } from "@/components/NatureDecorations";
import { Shield, Upload, CheckCircle, Clock, XCircle } from "lucide-react";

const ORGANIZER_TYPES = [
  { value: "ngo", label: "🏢 NGO" },
  { value: "college_school", label: "🎓 College / School" },
  { value: "company_csr", label: "🏭 Company (CSR)" },
  { value: "community_group", label: "👥 Community Group" },
] as const;

export default function ApplyOrganizer() {
  const { user } = useAuth();
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<string>("ngo");
  const [officialEmail, setOfficialEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofType, setProofType] = useState("id_card");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("organizer_applications" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setExisting(data);
      setLoading(false);
    })();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!orgName.trim() || !officialEmail.trim() || !contactNumber.trim() || !purpose.trim()) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let proofUrl = "";
      if (proofFile) {
        const ext = proofFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("organizer-proofs")
          .upload(path, proofFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("organizer-proofs").getPublicUrl(path);
        proofUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("organizer_applications" as any).insert({
        user_id: user.id,
        organization_name: orgName.trim(),
        organizer_type: orgType,
        official_email: officialEmail.trim(),
        contact_number: contactNumber.trim(),
        purpose: purpose.trim(),
        proof_url: proofUrl || null,
        proof_type: proofFile ? proofType : null,
        website_url: websiteUrl.trim() || null,
      });
      if (error) throw error;

      toast({ title: "Application submitted!", description: "You'll be notified once it's reviewed." });
      // Refresh
      const { data } = await supabase
        .from("organizer_applications" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setExisting(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-5 w-5 text-yellow-600" />,
    approved: <CheckCircle className="h-5 w-5 text-green-600" />,
    rejected: <XCircle className="h-5 w-5 text-red-600" />,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        <PageHeaderDecor />
        <div className="container relative mx-auto max-w-2xl px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-display text-2xl font-bold">Apply as Organizer</h1>
              <p className="text-sm text-muted-foreground">Submit your application to create and manage events.</p>
            </div>
          </div>

          {existing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {statusIcons[existing.status]}
                  Application {existing.status === "pending" ? "Under Review" : existing.status === "approved" ? "Approved!" : "Rejected"}
                </CardTitle>
                <CardDescription>
                  Submitted on {new Date(existing.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Organization:</span> <strong>{existing.organization_name}</strong></div>
                  <div><span className="text-muted-foreground">Type:</span> <strong>{existing.organizer_type}</strong></div>
                  <div><span className="text-muted-foreground">Email:</span> <strong>{existing.official_email}</strong></div>
                  <div><span className="text-muted-foreground">Phone:</span> <strong>{existing.contact_number}</strong></div>
                </div>
                <div className="text-sm"><span className="text-muted-foreground">Purpose:</span> <p className="mt-1">{existing.purpose}</p></div>
                {existing.admin_remarks && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                    <strong>Admin Remarks:</strong> {existing.admin_remarks}
                  </div>
                )}
                {existing.status === "approved" && (
                  <p className="text-sm text-green-600 font-medium">🎉 Your role has been upgraded to Organizer. You can now create events!</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization / Group Name *</Label>
                    <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="e.g. Green Earth Foundation" maxLength={200} />
                  </div>

                  <div className="space-y-2">
                    <Label>Organizer Type *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {ORGANIZER_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setOrgType(t.value)}
                          className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-all hover:scale-[1.02] ${
                            orgType === t.value ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-primary/50"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="officialEmail">Official Email *</Label>
                      <Input id="officialEmail" type="email" value={officialEmail} onChange={(e) => setOfficialEmail(e.target.value)} required placeholder="org@example.com" maxLength={255} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number *</Label>
                      <Input id="contactNumber" type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required placeholder="+91 98765 43210" maxLength={20} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose / Description *</Label>
                    <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} required placeholder="Briefly describe your organization and why you want to create events..." maxLength={1000} rows={4} />
                  </div>

                  <div className="space-y-2">
                    <Label>Proof Document (optional)</Label>
                    <div className="flex gap-3">
                      <select
                        value={proofType}
                        onChange={(e) => setProofType(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="id_card">ID Card</option>
                        <option value="ngo_doc">NGO Registration Doc</option>
                        <option value="college_letter">College Letter</option>
                        <option value="website_url">Website / LinkedIn</option>
                      </select>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website / LinkedIn (optional)</Label>
                    <Input id="websiteUrl" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." maxLength={500} />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
