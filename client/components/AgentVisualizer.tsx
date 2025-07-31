'use client'
import React from 'react';
import { BarVisualizer, useVoiceAssistant, RoomAudioRenderer} from '@livekit/components-react';
import { VoiceControlBar } from '@/components/VoiceControlBar';

export function AgentVisualizer() {
    const { state: agentState, audioTrack } = useVoiceAssistant();
    return (
      <>
        <div className="h-[200px] w-full">
          <BarVisualizer
            state={agentState}
            barCount={5}
            trackRef={audioTrack}
            className="agent-visualizer"
            options={{ minHeight: 24 }}
          />
        </div>
        <RoomAudioRenderer/>
      </>
  
    );
  }