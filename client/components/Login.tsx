import { useState } from "react";
import { GoogleLogin } from '@react-oauth/google';

const passwordRegex = /^(?=[A-Za-z])(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*\-_])[A-Za-z\d!@#$%^&*\-_]{10,}$/;

export function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!passwordRegex.test(password)) {
        setError("Password must be 10+ chars, start with a letter and contain upper, lower, number and special");
        return;
      }
      const res = await fetch("http://localhost:5005/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.status === 401) {
        setError("Wrong password");
        return;
      }
      if (data.message === "verification_required") {
        const code = prompt("Enter verification code sent to your email");
        if (!code) return;
        const vr = await fetch("http://localhost:5005/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
          credentials: 'include',
        });
        if (!vr.ok) {
          setError("Invalid verification code");
          return;
        }
      }
      window.location.assign("/session");
    };

    const handleForgot = async () => {
      const em = prompt("Enter your email");
      if (!em) return;
      const fr = await fetch("http://localhost:5005/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
        credentials: 'include',
      });
      const fd = await fr.json();
      const code = prompt("Enter code sent to your email");
      const newPass = prompt("Enter new password");
      if (!code || !newPass) return;
      await fetch("http://localhost:5005/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, code, password: newPass }),
        credentials: 'include',
      });
      window.location.assign("/session");
    };

    return (
      <div className="flex-col max-w-sm w-full border-white border-1 rounded-2xl p-10 shadow-xl">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
          {error && <span className="text-red-400 text-sm">{error}</span>}

          <button
            type="submit"
            className="mt-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition font-semibold text-white"
          >
            Sign In / Sign Up
          </button>
          <button type="button" onClick={handleForgot} className="text-sm text-blue-300 hover:underline">Forgot password?</button>
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
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (cred) => {
              const token = cred.credential;
              if (!token) return;
              const res = await fetch('http://localhost:5005/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
                credentials: 'include',
              });
              if (res.ok) {
                window.location.assign('/session');
              } else {
                setError('Google auth failed');
              }
            }}
            onError={() => setError('Google auth failed')}
            shape="pill"
            width="250"
          />
        </div>
      </div>
    );
  }
