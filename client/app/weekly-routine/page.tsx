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
        try {
          const arr = await res.json();
          const data: RoutineData = {
            days: daysOfWeek.map((day) => ({
              day,
              blocks: (arr[day] || []).map((blk: any) => ({
                start: blk.start,
                end: blk.end,
                label: blk.name,
                category: blk.category,
                location: blk.location,
              })),
            })),
          };
          setRoutine(data);
        } catch (error) {
          // do nothing
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

