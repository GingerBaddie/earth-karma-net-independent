import { useEffect, useState } from "react";

interface BadgeUnlockAnimationProps {
  icon: string;
  name: string;
  onDismiss: () => void;
}

export default function BadgeUnlockAnimation({ icon, name, onDismiss }: BadgeUnlockAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
    >
      {/* Confetti particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className="absolute animate-fade-in"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            fontSize: `${12 + Math.random() * 16}px`,
            animationDelay: `${Math.random() * 0.5}s`,
            opacity: 0.7,
          }}
        >
          {["🌟", "✨", "🎉", "🌿", "💚", "⭐"][i % 6]}
        </span>
      ))}

      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <span className="text-7xl drop-shadow-lg">{icon}</span>
        <div className="text-center">
          <p className="text-2xl font-bold text-white font-display">Badge Unlocked!</p>
          <p className="text-lg text-white/80 mt-1">{name}</p>
        </div>
        <p className="text-sm text-white/50 mt-2">Tap to dismiss</p>
      </div>
    </div>
  );
}
