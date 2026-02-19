import { Progress } from "@/components/ui/progress";

interface BadgeCardProps {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number; // 0-100
  isNew?: boolean;
}

export default function BadgeCard({ icon, name, description, unlocked, progress, isNew }: BadgeCardProps) {
  return (
    <div
      className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:scale-105 ${
        unlocked
          ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
          : "opacity-50 grayscale"
      }`}
    >
      {isNew && unlocked && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground animate-scale-in">
          ✨
        </span>
      )}
      <span className="text-3xl">{icon}</span>
      <span className="text-xs font-semibold leading-tight">{name}</span>
      {!unlocked && (
        <div className="w-full">
          <Progress value={progress} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground">{Math.min(Math.round(progress), 100)}%</span>
        </div>
      )}
      {unlocked && (
        <span className="text-[10px] text-primary font-medium">Unlocked!</span>
      )}
    </div>
  );
}
