import { useState, useEffect, useRef } from "react";
import { FcGoogle } from "react-icons/fc";

export function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
  
    return (
      <div className="flex-col max-w-sm w-full border-white border-1 rounded-2xl p-10 shadow-xl">
        <form className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
  
          <input
            type="password"
            placeholder="Password"
            className="p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
  
          <button
            type="submit"
            className="mt-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition font-semibold text-white"
          >
            Sign In / Sign Up
          </button>
        </form>
  
        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-black px-2 text-gray-300">or</span>
          </div>
        </div>
  
        {/* Google auth */}
        <button className="w-full flex items-center justify-center gap-2 py-3 border border-white/30 rounded-xl hover:bg-white/10 transition text-white">
          <FcGoogle className="text-xl" />
          Continue with Google
        </button>
      </div>
    );
  }