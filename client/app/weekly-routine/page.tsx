'use client';

import { useEffect, useState } from 'react';
import WeeklyRoutine, { RoutineData } from '@/components/WeeklyRoutine';
import { SERVER_URL } from '@/utils/constants';

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function WeeklyRoutinePage() {
  const [routine, setRoutine] = useState<RoutineData | null>(null);

  useEffect(() => {
    async function fetchRoutine() {
      const ures = await fetch(`${SERVER_URL}/auth/validate`, {
        credentials: 'include',
      });
      if (!ures.ok) {
        window.location.assign('/login');
        return;
      }
      const user = await ures.json();
      const res = await fetch(
        `${SERVER_URL}/weeklyRoutines?userid=${user.id}`,
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
          const latest = arr[0];
          const data: RoutineData = {
            days: daysOfWeek.map((day) => ({
              day,
              blocks: (latest[day] || []).map((blk: any) => ({
                start: blk.start,
                end: blk.end,
                label: blk.name,
                category: blk.category,
                location: blk.location,
              })),
            })),
          };
          setRoutine(data);
        }
      }
    }
    fetchRoutine();
  }, []);

  if (!routine) {
    return <div className="p-4 text-white">Loading...</div>;
  }

  return (
    <div className="p-4 text-white">
      <WeeklyRoutine data={routine} />
    </div>
  );
}

