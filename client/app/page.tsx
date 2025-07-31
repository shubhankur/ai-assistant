'use client'
import Hello from "@/components/Hello";
import { LoadingView } from "@/components/LoadingView";
import { useEffect, useState } from "react";
import { SERVER_URL } from '@/utils/constants';
import { motion, AnimatePresence } from 'framer-motion';


export default function Home(){
  const [centerMessage, setCenterMessage] = useState("take a deeep breath")
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${SERVER_URL}/auth/validate`, { credentials: 'include' })
        if (res.ok) {
          const u = await res.json()
          setTimeout(()=>{
            if(!u.verified) {
              window.location.assign("/login?verify=1")
            }
            else if(!u.stage || u.stage == 1) {
              window.location.assign("/session")
            }
            else{
              window.location.assign("/day")
            }
          }, 0)
        }
        else{
          setTimeout(() => {
            handle_auth_fail();
          }, 0)
        }
      } catch (e) {
        setTimeout(() => {
            handle_auth_fail();
          }, 0)
      }

      function handle_auth_fail() {
        const visitor = localStorage.getItem("visitor_id");
        if (!visitor) {
          localStorage.setItem("visitor_id", Math.floor(100000 + Math.random() * 900000).toString())
          setTimeout(() => window.location.assign("/login"), 5000)
        }
        else {
        window.location.assign("/login")
        }
        return
        //setCenterMessage("take a few deep breaths");
      }
    }
    fetchUser()
  }, [])

  return(
    <div className="flex flex-col justify-center">
      <AnimatePresence mode="wait">
        (
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
        )
      </AnimatePresence>
    </div>
  )
}