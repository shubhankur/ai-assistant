'use client'
import { useEffect, useState } from 'react';
import { BarVisualizer, useVoiceAssistant, useTrackToggle, RoomAudioRenderer } from '@livekit/components-react';
import { NoAgentNotification } from "@/components/NoAgentNotification";

import ConnectRoom from '../../components/ConnectRoom';
import { TypeAnimation } from 'react-type-animation';
import { Track } from 'livekit-client';

import { AnimatePresence, motion } from "framer-motion";

function SessionContent() {
  const { state: agentState } = useVoiceAssistant();
  console.log("state: ", agentState)

  return (
    <>
      <AnimatePresence mode="wait">
        {(
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex flex-col items-center gap-4 h-full"
          >
            <AgentVisualizer />
            <RoomAudioRenderer />
            <NoAgentNotification state={agentState} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function AgentVisualizer() {
  const { state: agentState, videoTrack, audioTrack } = useVoiceAssistant();

  return (
    <div className="h-[300px] w-full">
      <BarVisualizer
        state={agentState}
        barCount={5}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

export default function SessionPage() {
  const [feelings, setFeelings] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setFeelings(params.get('feelings') || '');
    }
  }, []);
  return (
    <ConnectRoom feelings={feelings}>
      <SessionContent />
    </ConnectRoom>
  );
}
