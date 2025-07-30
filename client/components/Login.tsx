import { useState, useEffect } from "react";
import { GoogleLogin, GoogleOAuthProvider, PromptMomentNotification } from '@react-oauth/google';
import { SERVER_URL } from '@/utils/constants';

const passwordRegex = /^(?=[A-Za-z])(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*\-_])[A-Za-z\d!@#$%^&*\-_]{10,}$/;

export function Login({ initialVerify = false }: { initialVerify?: boolean } = {}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [verifying, setVerifying] = useState(initialVerify);
    const [verifyCode, setVerifyCode] = useState("");

    useEffect(() => {
      if (initialVerify) {
        const storedEmail = localStorage.getItem('verificationEmail');
        if (storedEmail) setEmail(storedEmail);
      }
    }, [initialVerify]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!passwordRegex.test(password)) {
        setError("Password must be 10+ chars, start with a letter and contain atleast one uppercase, lowercase, number and a special character");
        return;
      }
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.status === 401) {
        setError("Wrong password");
        setLoading(false);
        return;
      }
      if (data.message === "verification_required") {
        localStorage.setItem('verificationEmail', email);
        window.location.assign('/?verify=1');
        setLoading(false);
        return;
      }
      setLoading(false);
      const stage = data.stage ?? 1;
      if (stage >= 1 && stage < 5) window.location.assign('/session');
      else if (stage === 5) window.location.assign('/day');
    };

    const handleForgot = async () => {
      const em = prompt("Enter your email");
      if (!em) return;
      const fr = await fetch(`${SERVER_URL}/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
        credentials: 'include',
      });
      const fd = await fr.json();
      const code = prompt("Enter code sent to your email");
      const newPass = prompt("Enter new password");
      if (!code || !newPass) return;
      await fetch(`${SERVER_URL}/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, code, password: newPass }),
        credentials: 'include',
      });
      window.location.assign("/session");
    };

    const handleVerify = async () => {
      const vr = await fetch(`${SERVER_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verifyCode }),
        credentials: 'include',
      });
      const data = await vr.json();
      if (!vr.ok) {
        setError("Invalid verification code");
        return;
      }
      const stage = data.stage ?? 1;
      if (stage == 1) window.location.assign('/session');
      else window.location.assign('/day');
    };

    const onGoogleClick = () => {
        setGoogleLoading(true)
    }

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
            {loading ? 'Loading...' : 'Sign In / Sign Up'}
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
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            {/* Google auth */}
            <div className="flex justify-center">
            <GoogleLogin
                text="continue_with"
                onSuccess={async (cred) => {
                    const token = cred.credential;
                    if (!token) return;
                    setGoogleLoading(true);
                    const res = await fetch(`${SERVER_URL}/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token }),
                        credentials: 'include',
                    });
                    const data = await res.json();
                    setGoogleLoading(false);
                    if (res.ok) {
                        const stage = data.stage ?? 1;
                        if (Number(stage) === 1) window.location.assign('/session');
                        else window.location.assign('/day');
                    } else {
                        setError('Google auth failed');
                    }
                }}
                onError={() => { setError('Google auth failed'); setGoogleLoading(false); }}
                shape="pill"
                width="250"
                useOneTap={true}
                theme="filled_blue"
                type="standard"
                click_listener={onGoogleClick}
            />
            {googleLoading && <span className="text-white ml-2">Loading...</span>}
            </div>
        </GoogleOAuthProvider>
        {verifying && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-xl space-y-4">
              <p className="text-white">Enter verification code</p>
              <input
                className="p-2 rounded-md bg-gray-700 text-white focus:outline-none"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button className="px-4 py-1 bg-gray-600 rounded" onClick={()=>setVerifying(false)}>Cancel</button>
                <button className="px-4 py-1 bg-blue-600 rounded" onClick={handleVerify}>Verify</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
