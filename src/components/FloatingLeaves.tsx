import { useEffect, useState } from "react";

interface Leaf {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  emoji: string;
}

const leafEmojis = ["🍃", "🌿", "🍂", "☘️"];

const FloatingLeaves = () => {
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    const generated: Leaf[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 14 + Math.random() * 18,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 10,
      emoji: leafEmojis[Math.floor(Math.random() * leafEmojis.length)],
    }));
    setLeaves(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {leaves.map((leaf) => (
        <span
          key={leaf.id}
          className="absolute animate-float-leaf"
          style={{
            left: `${leaf.left}%`,
            top: "-40px",
            fontSize: `${leaf.size}px`,
            animationDuration: `${leaf.duration}s`,
            animationDelay: `${leaf.delay}s`,
            opacity: 0,
          }}
        >
          {leaf.emoji}
        </span>
      ))}
    </div>
  );
};

export default FloatingLeaves;
