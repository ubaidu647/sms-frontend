import {
  Award,
  BarChart3,
  BookOpen,
  Bus,
  CalendarCheck,
  ClipboardList,
  Clock,
  Coins,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Library,
  MessageCircle,
  Package,
  School,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

// Named imports (not `import *`) so the bundle only carries these icons.
const ICONS = {
  Award,
  BarChart3,
  BookOpen,
  Bus,
  CalendarCheck,
  ClipboardList,
  Clock,
  Coins,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Library,
  MessageCircle,
  Package,
  School,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
};

/** Renders a lucide icon by the name used in landingData.js. */
export default function LandingIcon({ name, className }) {
  const Icon = ICONS[name] ?? School;
  return <Icon className={className} aria-hidden="true" />;
}
