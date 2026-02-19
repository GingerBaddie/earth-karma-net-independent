import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BadgeCard from "./BadgeCard";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria_type: string;
  criteria_value: number;
}

interface BadgeShowcaseProps {
  badges: Badge[];
  unlockedBadgeIds: string[];
  userStats: {
    total_activities: number;
    tree_plantation_count: number;
    cleanup_count: number;
    recycling_count: number;
    eco_habit_count: number;
    waste_kg: number;
    streak_days: number;
  };
  newBadgeIds: string[];
}

const CATEGORY_LABELS: Record<string, { title: string; icon: string }> = {
  milestone: { title: "Milestone Badges", icon: "🏅" },
  streak: { title: "Streak Badges", icon: "🔥" },
  community_impact: { title: "Community Impact", icon: "🌍" },
};

function getProgress(badge: Badge, stats: BadgeShowcaseProps["userStats"]): number {
  const current = (() => {
    switch (badge.criteria_type) {
      case "total_activities": return stats.total_activities;
      case "tree_plantation_count": return stats.tree_plantation_count;
      case "cleanup_count": return stats.cleanup_count;
      case "recycling_count": return stats.recycling_count;
      case "eco_habit_count": return stats.eco_habit_count;
      case "waste_kg": return stats.waste_kg;
      case "streak_days": return stats.streak_days;
      default: return 0;
    }
  })();
  return Math.min((current / badge.criteria_value) * 100, 100);
}

export default function BadgeShowcase({ badges, unlockedBadgeIds, userStats, newBadgeIds }: BadgeShowcaseProps) {
  const categories = ["milestone", "streak", "community_impact"];

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const catBadges = badges.filter((b) => b.category === cat);
        if (catBadges.length === 0) return null;
        const { title, icon } = CATEGORY_LABELS[cat] || { title: cat, icon: "🏅" };
        return (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">{icon} {title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {catBadges.map((b) => (
                  <BadgeCard
                    key={b.id}
                    icon={b.icon}
                    name={b.name}
                    description={b.description}
                    unlocked={unlockedBadgeIds.includes(b.id)}
                    progress={getProgress(b, userStats)}
                    isNew={newBadgeIds.includes(b.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
