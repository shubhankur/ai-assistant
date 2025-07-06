'use client'
import { useEffect, useState } from 'react';
import { BarVisualizer, DisconnectButton, VoiceAssistantControlBar, useVoiceAssistant, useTrackToggle, RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';
import { NoAgentNotification } from "@/components/NoAgentNotification";
import ConnectRoom from '../../components/ConnectRoom';
import TranscriptionView from '@/components/TranscriptionView'

import { AnimatePresence, motion } from "framer-motion";

function SessionContent() {
  const { state: agentState } = useVoiceAssistant();
  console.log("state: ", agentState)

  return (
    <div className="relative flex flex-col w-full h-full items-center">
      <AnimatePresence mode="wait">
        {(
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex flex-col items-center"
          >
            <AgentVisualizer />
            <div className="flex-1 w-full">
              <TranscriptionView />
            </div>
            <RoomAudioRenderer />
            <NoAgentNotification state={agentState} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex flex-col items-center"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
          </motion.div>
      </AnimatePresence>

    </div>
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

function UserView(){
  const {localParticipant} = useLocalParticipant()
  localParticipant.getTrackPublicationByName
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
