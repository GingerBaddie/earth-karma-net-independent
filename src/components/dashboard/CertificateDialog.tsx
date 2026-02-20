import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Download, Printer } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

const TYPE_LABELS: Record<string, string> = {
  tree_plantation: "Tree Plantation",
  cleanup: "Cleanup Drive",
  recycling: "Recycling",
  eco_habit: "Eco Habit",
};

const TYPE_ICONS: Record<string, string> = {
  tree_plantation: "🌳",
  cleanup: "🧹",
  recycling: "♻️",
  eco_habit: "🌿",
};

interface CertificateDialogProps {
  activity: Activity;
  userName: string;
  children?: React.ReactNode;
}

export default function CertificateDialog({ activity, userName, children }: CertificateDialogProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = certRef.current?.innerHTML;
    if (!printContents) return;
    const win = window.open("", "_blank", "width=900,height=650");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate of Appreciation</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'DM Sans', sans-serif; background: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .cert-wrap { width: 800px; }
          </style>
        </head>
        <body>
          <div class="cert-wrap">${printContents}</div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const date = new Date(activity.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const activityLabel = TYPE_LABELS[activity.type] || activity.type;
  const activityIcon = TYPE_ICONS[activity.type] || "🌱";
  const points = activity.points_awarded;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
            <Award className="h-3.5 w-3.5" />
            Certificate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-4">
        <DialogTitle className="sr-only">Certificate of Appreciation</DialogTitle>

        {/* Print controls */}
        <div className="mb-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </Button>
        </div>

        {/* Certificate */}
        <div ref={certRef}>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              background: "linear-gradient(135deg, #f0fdf4 0%, #fefce8 50%, #f0fdf4 100%)",
              border: "3px solid #16a34a",
              borderRadius: "12px",
              padding: "0",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Corner decorations */}
            <div style={{ position: "absolute", top: 0, left: 0, width: 80, height: 80, background: "linear-gradient(135deg, #16a34a, #4ade80)", opacity: 0.15, borderRadius: "0 0 100% 0" }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: "linear-gradient(225deg, #16a34a, #4ade80)", opacity: 0.15, borderRadius: "0 0 0 100%" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 80, height: 80, background: "linear-gradient(45deg, #16a34a, #4ade80)", opacity: 0.15, borderRadius: "0 100% 0 0" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 80, height: 80, background: "linear-gradient(315deg, #16a34a, #4ade80)", opacity: 0.15, borderRadius: "100% 0 0 0" }} />

            {/* Inner border */}
            <div style={{ margin: "12px", border: "1px solid rgba(22,163,74,0.3)", borderRadius: "8px", padding: "32px 40px" }}>
              
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ fontSize: "40px", marginBottom: "4px" }}>🌍</div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "4px", textTransform: "uppercase", color: "#16a34a", marginBottom: "8px" }}>
                  Earth Karma Network
                </div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "32px", fontWeight: 800, color: "#14532d", lineHeight: 1.2 }}>
                  Certificate of Appreciation
                </div>
                <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg, #16a34a, #84cc16)", margin: "12px auto 0", borderRadius: "2px" }} />
              </div>

              {/* Body */}
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <p style={{ color: "#4b7250", fontSize: "14px", marginBottom: "16px" }}>
                  This is to proudly certify that
                </p>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "30px", fontWeight: 700, color: "#14532d", borderBottom: "2px solid rgba(22,163,74,0.3)", paddingBottom: "8px", marginBottom: "16px", display: "inline-block", minWidth: "300px" }}>
                  {userName}
                </div>
                <p style={{ color: "#4b7250", fontSize: "14px", marginBottom: "20px" }}>
                  has demonstrated outstanding commitment to environmental stewardship
                </p>

                {/* Activity highlight */}
                <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "10px", padding: "16px 24px", display: "inline-block", marginBottom: "20px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "4px" }}>{activityIcon}</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "18px", fontWeight: 700, color: "#15803d" }}>{activityLabel}</div>
                  <div style={{ fontSize: "12px", color: "#4b7250", marginTop: "4px" }}>
                    Completed on {date}
                  </div>
                  {activity.waste_kg && (
                    <div style={{ fontSize: "12px", color: "#4b7250" }}>{activity.waste_kg} kg waste collected</div>
                  )}
                </div>

                {/* Points */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <div style={{ background: "linear-gradient(135deg, #16a34a, #84cc16)", borderRadius: "20px", padding: "6px 20px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "16px" }}>⭐</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#fff", fontSize: "16px" }}>{points} Eco Points Earned</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(22,163,74,0.2)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "100px", borderBottom: "1px solid #4b7250", marginBottom: "4px" }} />
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "11px", color: "#4b7250", fontWeight: 600 }}>Super Admin</div>
                  <div style={{ fontSize: "10px", color: "#86a98e" }}>Earth Karma Network</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "4px" }}>🏅</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "9px", color: "#86a98e", letterSpacing: "1px" }}>VERIFIED ACTIVITY</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "100px", borderBottom: "1px solid #4b7250", marginBottom: "4px" }} />
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "11px", color: "#4b7250", fontWeight: 600 }}>Date Approved</div>
                  <div style={{ fontSize: "10px", color: "#86a98e" }}>{date}</div>
                </div>
              </div>

              {/* Tagline */}
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <p style={{ fontSize: "11px", color: "#86a98e", fontStyle: "italic" }}>
                  "Every small action counts towards a greener tomorrow" 🌿
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
