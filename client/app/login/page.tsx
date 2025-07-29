'use client'
import { Login } from '@/components/Login';
import Hello from '../../components/Hello';
import { TypeAnimation } from 'react-type-animation';
import { useEffect, useState } from 'react';

export default function Home() {
  const [showHelperDiv, setShowHelperDiv] = useState(false);
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('http://localhost:5005/auth/validate', { credentials: 'include' })
        if (res.ok) {
          const u = await res.json()
          window.location.assign('/day')
        } 
      } catch (e) {
        /* ignore */
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowHelperDiv(true), 4100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen gap-8 bg-gradient-to-br from-black to-gray-800 p-6">
      <Hello />
      {showHelperDiv && (
        <div className='flex items-center gap-1'>
          <TypeAnimation
            sequence={["I am your personal assistant.", 1000, "I will help you"]}
            wrapper="span"
            speed={50}
            className="text-xl text-white"
            omitDeletionAnimation={true}
            cursor={false}
          />
          <TypeAnimation
            sequence={[3500, "schedule", 1500, "journal", 1500, "meditate", 1500, "improve your lifestyle"]}
            wrapper="span"
            speed={50}
            className="text-xl text-white"
            omitDeletionAnimation={true}
          />
        </div>
      )}
      <Login/>
    </div>
  );
}
