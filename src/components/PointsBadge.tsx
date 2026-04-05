import { Link } from "react-router-dom";

export function PointsBadge({ points }: { points: number }) {
  const formatted = points.toLocaleString("ko-KR");
  return (
    <Link
      to="/shop"
      className="flex items-center gap-1.5 rounded-full bg-primary-container/20 px-4 py-1.5 transition-transform duration-200 active:scale-95"
    >
      <span className="text-sm font-bold text-primary">{formatted}P</span>
    </Link>
  );
}
