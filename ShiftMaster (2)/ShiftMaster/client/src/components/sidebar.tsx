import { Calendar, BarChart3, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

const navigation = [
  { name: "Schedule View", href: "/", icon: Calendar, current: true },
  { name: "Analytics", href: "/analytics", icon: BarChart3, current: false },
  { name: "Settings", href: "/settings", icon: Settings, current: false },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-neutral-300 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-neutral-300">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">ShiftMaster</h1>
            <p className="text-sm text-neutral-500">Scheduling System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isCurrent = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-primary text-white"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}>
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-neutral-300">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-neutral-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">SJ</span>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">Sarah Johnson</p>
            <p className="text-xs text-neutral-500">Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
