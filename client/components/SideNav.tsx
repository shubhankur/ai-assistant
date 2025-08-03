'use client';

import Link from 'next/link';
import { useState, ReactNode } from 'react';
import {
  Calendar,
  CalendarClock,
  Star,
  Sparkles,
  Repeat,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export default function SideNav() {
  const [collapsed, setCollapsed] = useState(true);

  const items: NavItem[] = [
    { href: '/today', label: 'Today', icon: <Calendar className="w-5 h-5" /> },
    { href: '/tomorrow', label: 'Tomorrow', icon: <CalendarClock className="w-5 h-5" /> },
    { href: '/aspirations', label: 'Aspirations', icon: <Star className="w-5 h-5" /> },
    { href: '/ai-suggestions', label: 'AI Suggestions', icon: <Sparkles className="w-5 h-5" /> },
    { href: '/weekly-routine', label: 'Weekly Routine', icon: <Repeat className="w-5 h-5" /> },
    { href: '/journal', label: 'Journal', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <nav
      className={`bg-gray-900 text-white min-h-screen p-4 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-48'
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-6 self-end text-gray-400 hover:text-white"
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>
      <ul className="space-y-2 flex-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-2 hover:text-gray-300"
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

