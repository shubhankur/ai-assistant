'use client';

import { useEffect, useState } from 'react';
import { SERVER_URL } from '@/utils/constants';
import { Card } from '@/components/ui/card';

interface JournalEntry {
  _id: string;
  date: string;
  summary: string;
  appreciation?: string[];
  improvements?: string[];
  created_at: string;
}

type GroupedJournals = Record<string, JournalEntry[]>;

export default function JournalPage() {
  const [journals, setJournals] = useState<GroupedJournals>({});

  useEffect(() => {
    async function fetchJournals() {
      const ures = await fetch(`${SERVER_URL}/auth/validate`, {
        credentials: 'include',
      });
      if (!ures.ok) {
        window.location.assign('/login');
        return;
      }

      const res = await fetch(`${SERVER_URL}/journals/fetchAll`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: JournalEntry[] = await res.json();
        const grouped = data.reduce((acc: GroupedJournals, entry) => {
          (acc[entry.date] = acc[entry.date] || []).push(entry);
          return acc;
        }, {});
        Object.keys(grouped).forEach((date) => {
          grouped[date].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        });
        setJournals(grouped);
      }
    }
    fetchJournals();
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

  const formatTime = (created: string) =>
    new Date(created).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

  const dates = Object.keys(journals).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-4 text-white space-y-8">
      {dates.map((date) => (
        <div key={date}>
          <h2 className="text-lg font-semibold mb-4">{formatDate(date)}</h2>
          <div className="relative border-l border-gray-700 ml-2">
            {journals[date].map((entry) => (
              <div key={entry._id} className="relative pl-6 pb-6">
                <span className="absolute left-0 top-1 w-3 h-3 rounded-full bg-white" />
                <div>
                  <time className="text-sm text-gray-400">
                    {formatTime(entry.created_at)}
                  </time>
                  <Card className="bg-gray-900/50 p-4 mt-2 space-y-2">
                    <p>{entry.summary}</p>
                    {entry.appreciation?.length ? (
                      <div>
                        <h3 className="font-semibold">Appreciation</h3>
                        <ul className="list-disc ml-5 space-y-1">
                          {entry.appreciation.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {entry.improvements?.length ? (
                      <div>
                        <h3 className="font-semibold">Improvements</h3>
                        <ul className="list-disc ml-5 space-y-1">
                          {entry.improvements.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

