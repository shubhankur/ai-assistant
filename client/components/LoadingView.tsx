'use client'
import { useEffect, useState } from "react";
import {motion, AnimatePresence} from 'framer-motion'

interface LoadingRingConfig {
    centerMessage : string,

}

export const LoadingRing = ({ centerMessage }: { centerMessage: string }) => (
    <div className="relative flex items-center justify-center w-32 h-32 mb-6 select-none">
      {/** Pulsating outline */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-primary border-red"
        animate={{ scale: [2.5, 4 , 2.5], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
      />
  
      <span className="absolute text-sm font-medium text-white text-center px-2 pointer-events-none">
        {centerMessage}
      </span>
    </div>
  );

interface Configurations {
    centerMessage: string    
    messages: string[]
}

export function LoadingView(messageList: Configurations) {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        // advance to the next line every 1.8 s, stop on the last
        const id = setInterval(() => {
            setIdx((n) => (n < messageList.messages.length - 1 ? n + 1 : n));
        }, 7500);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex flex-col items-center text-white ">
            <LoadingRing centerMessage={messageList.centerMessage} />

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