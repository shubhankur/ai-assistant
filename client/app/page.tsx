'use client'
import { Login } from '@/components/Login';
import Hello from '../components/Hello';

export default function Home() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen gap-8 bg-gradient-to-br from-black to-gray-800 p-6">
      <Hello />
      <Login/>
    </div>
  );
}
