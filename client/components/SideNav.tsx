'use client';

import Link from 'next/link';
import { useState, ReactNode, useEffect } from 'react';
import {
  Calendar,
  CalendarClock,
  Star,
  Sparkles,
  Repeat,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Info,
  Shield,
  LogOut
} from 'lucide-react';
import { SERVER_URL } from '@/utils/constants';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export default function SideNav() {
  const [collapsed, setCollapsed] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${SERVER_URL}/auth/validate`, { credentials: 'include' });
        if (res.ok) {
          const u = await res.json();
          setName(u.name);
        }
      } catch (_) {
        /* ignore */
      }
    }
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await fetch(`${SERVER_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    window.location.assign('/');
  };

  const items: NavItem[] = [
    { href: '/today', label: 'Today', icon: <Calendar className="w-5 h-5" /> },
    { href: '/tomorrow', label: 'Tomorrow', icon: <CalendarClock className="w-5 h-5" /> },
    { href: '/aspirations', label: 'Aspirations', icon: <Star className="w-5 h-5" /> },
    { href: '/ai-suggestions', label: 'AI Suggestions', icon: <Sparkles className="w-5 h-5" /> },
    { href: '/weekly-routine', label: 'Weekly Routine', icon: <Repeat className="w-5 h-5" /> },
    { href: '/journal', label: 'Journal', icon: <BookOpen className="w-5 h-5" /> },
    { href: '/about', label: 'About', icon: <Info className="w-5 h-5" /> },
    { href: '/privacy', label: 'Privacy Policy', icon: <Shield className="w-5 h-5" /> }
  ];

  return (
    <nav
      className={`bg-black text-white min-h-screen p-4 flex flex-col transition-all duration-300 ${
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
        {name && !collapsed && <li className="px-2 text-sm text-gray-300">{name}</li>}
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
      {name && (
        <button
          onClick={handleSignOut}
          className="mt-4 flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      )}
    </nav>
  );
}