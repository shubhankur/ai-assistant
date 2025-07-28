'use client'
import { useEffect, useState } from "react";
import {motion, AnimatePresence} from 'framer-motion'

const LoadingRing = () => (
    <div className="relative flex items-center justify-center w-32 h-32 mb-6 select-none">
      {/** Pulsating outline */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-primary"
        animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
      />
  
      <span className="absolute text-sm font-medium text-primary-foreground text-center px-2 pointer-events-none">
        take a deep breath
      </span>
    </div>
  );

interface MessageList {    
    messages: string[]
}

export function LoadingView(messageList: MessageList) {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        // advance to the next line every 1.8 s, stop on the last
        const id = setInterval(() => {
            setIdx((n) => (n < messageList.messages.length - 1 ? n + 1 : n));
        }, 1500);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex flex-col items-center text-muted-foreground">
            <LoadingRing />

            <AnimatePresence mode="wait" initial={true}>
                <motion.p
                    key={idx /* unique key so each line gets its own exit animation */}
                    className="text-sm text-muted-foreground"
                    initial={{ y: 4, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -4, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {messageList.messages[idx]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}