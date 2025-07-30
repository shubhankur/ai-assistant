'use client'
import Hello from "@/components/Hello";
import { LoadingView } from "@/components/LoadingView";
import { Login } from "@/components/Login";
import { useEffect, useState } from "react";
import { SERVER_URL } from '@/utils/constants';
import { TypeAnimation } from 'react-type-animation';
import { motion, AnimatePresence } from 'framer-motion';


export default function Home(){
  const [showLogin, setShowLogin] = useState(false)
  const [centerMessage, setCenterMessage] = useState("take a deeep breath")
  const [verify, setVerify] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if(params.get('verify') === '1') {
      setVerify(true)
      setShowLogin(true)
    }
    async function fetchUser() {
      try {
        const res = await fetch(`${SERVER_URL}/auth/validate`, { credentials: 'include' })
        if (res.ok) {
          const u = await res.json()
          setTimeout(()=>{
            if(!u.stage || u.stage == 1) {
              window.location.assign("/session")
            }
            else{
              window.location.assign("/day")
            }
          }, 5000)
        }
        else{
          setTimeout(() => {
            handle_auth_fail();
          }, 5000)
        }
      } catch (e) {
        setTimeout(() => {
            handle_auth_fail();
          }, 5000)
      }

      function handle_auth_fail() {
        const visitor = localStorage.getItem("visitor_id");
        if (!visitor) {
          localStorage.setItem("visitor_id", Math.floor(100000 + Math.random() * 900000).toString())
        }
        setShowLogin(true)
        if(verify) setVerify(true)
        setCenterMessage("take a few deep breaths");
      }
    }
    fetchUser()
  }, [])

  return(
    <div className="flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {!showLogin && (
          <motion.div 
            key="loading"
            className='bg-black flex flex-col items-center justify-center min-h-screen gap-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
              <Hello/>
              <LoadingView centerMessage={centerMessage} messages={[]} />
          </motion.div>
        )}
        {showLogin && (
          <motion.div
            key="login"
            className="flex flex-col items-center justify-center min-h-screen text-white px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="text-center mb-2 max-w-2xl">
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Your Personal AI Assistant
              </h1>
              <div className="space-y-3 text-lg text-gray-200 leading-relaxed">
                <p>
                  I am your personal assistant, Powered by AI, Built just for you.
                </p>
                <p>
                  You can talk to me just like a human assistant and I will plan your day.
                </p>
                <p>
                  I will also help improve your lifestyle by adding good habits and help you move closer to your goals.
                </p>
                <p className="text-indigo-300 font-semibold">
                  So, let's jump in.
                </p>
              </div>
            </div>
            
            {/* Jumping Arrow Animation */}
            <motion.div
              className="mb-6 text-indigo-400"
              animate={{ 
                y: [0, 20, 0],
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
            </motion.div>
            
            <Login initialVerify={verify}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}