import CountUp from "@/components/animations/CountUp";
import { stats } from "@/data/site";

export default function StatsStrip({ className = "" }) {
  return (
    <div className={`statsStrip ${className}`}>
      {stats.map((stat) => (
        <div className="statsStrip__item" key={stat.label}>
          <strong><CountUp value={stat.value} suffix={stat.suffix} /></strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
