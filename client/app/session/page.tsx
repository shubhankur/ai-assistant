'use client'
import { useEffect, useState } from 'react';
import { BarVisualizer, useVoiceAssistant, useTrackToggle } from '@livekit/components-react';
function SessionContent() {
    <div className="flex flex-col items-center p-6 gap-4">
      <div className="w-full max-w-xl h-48 overflow-y-auto p-4 border rounded bg-white/70 backdrop-blur-md">
        <TypeAnimation sequence={[text]} speed={70} style={{ whiteSpace: 'pre-line' }} />
      <BarVisualizer className="w-64 h-16" state={state} />
      <button {...buttonProps} className="px-4 py-2 rounded bg-purple-600 text-white">
        {enabled ? 'Mute' : 'Unmute'}
      </button>
    </div>
  );
}

export default function SessionPage() {
  return (
    <ConnectRoom>
      <SessionContent />
    setText(agentTranscriptions.map((t) => t.text).join(' '));
  }, [agentTranscriptions]);

  return (
    <ConnectRoom>
      <div className="flex flex-col items-center p-6 gap-4">
        <div className="w-full max-w-xl h-48 overflow-y-auto p-4 border rounded bg-white/70 backdrop-blur-md">
          <TypeAnimation sequence={[text]} speed={70} style={{ whiteSpace: 'pre-line' }} />
        </div>
        <BarVisualizer className="w-64 h-16" state={state} />
        <button {...buttonProps} className="px-4 py-2 rounded bg-purple-600 text-white">
          {enabled ? 'Mute' : 'Unmute'}
        </button>
      </div>
    </ConnectRoom>
  );
}
