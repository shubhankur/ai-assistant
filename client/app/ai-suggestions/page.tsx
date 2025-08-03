'use client';

import { useEffect, useState } from 'react';
import { SERVER_URL } from '@/utils/constants';
import { Card } from '@/components/ui/card';

interface Suggestion {
  suggestion: string;
  reason: string;
  targets: string;
}

interface OngoingChanges {
  HIGH_PRIORITY?: Suggestion[];
  MEDIUM_PRIORITY?: Suggestion[];
  LOW_PRIORITY?: Suggestion[];
}

export default function AISuggestionsPage() {
  const [data, setData] = useState<OngoingChanges | null>(null);

  useEffect(() => {
    async function fetchData() {
      const ures = await fetch(`${SERVER_URL}/auth/validate`, {
        credentials: 'include',
      });
      if (!ures.ok) {
        window.location.assign('/login');
        return;
      }
      const user = await ures.json();
      const res = await fetch(
        `${SERVER_URL}/ongoingChanges?userid=${user.id}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length > 0) {
          arr.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          setData(arr[0]);
        }
      }
    }
    fetchData();
  }, []);

  if (!data) {
    return <div className="p-4 text-white">Loading...</div>;
  }

  const renderSection = (title: string, items?: Suggestion[]) =>
    items && items.length > 0 ? (
      <Card className="bg-gray-900/50 p-4">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <ul className="space-y-2">
          {items.map((s, idx) => (
            <li key={idx}>
              <p className="font-medium">{s.suggestion}</p>
              <p className="text-sm text-gray-400">{s.reason}</p>
            </li>
          ))}
        </ul>
      </Card>
    ) : null;

  return (
    <div className="p-4 text-white space-y-4">
      {renderSection('High Priority', data.HIGH_PRIORITY)}
      {renderSection('Medium Priority', data.MEDIUM_PRIORITY)}
      {renderSection('Low Priority', data.LOW_PRIORITY)}
    </div>
  );
}

