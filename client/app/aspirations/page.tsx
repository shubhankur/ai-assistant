'use client';

import { useEffect, useState } from 'react';
import { SERVER_URL } from '@/utils/constants';
import { Card } from '@/components/ui/card';

interface DesiredHabitChanges {
  goals?: string[];
  lifestyle_changes?: string[];
  activities_to_add?: string[];
  activities_to_remove?: string[];
}

export default function AspirationsPage() {
  const [data, setData] = useState<DesiredHabitChanges | null>(null);

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
        `${SERVER_URL}/desiredHabitChanges?userid=${user.id}`,
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

  const Section = ({ title, items }: { title: string; items?: string[] }) =>
    items && items.length > 0 ? (
      <Card className="bg-gray-900/50 p-4">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <ul className="list-disc ml-5 space-y-1">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </Card>
    ) : null;

  return (
    <div className="p-4 text-white space-y-4">
      <Section title="Goals" items={data.goals} />
      <Section title="Lifestyle Changes" items={data.lifestyle_changes} />
      <Section title="Activities to Add" items={data.activities_to_add} />
      <Section title="Activities to Remove" items={data.activities_to_remove} />
    </div>
  );
}

