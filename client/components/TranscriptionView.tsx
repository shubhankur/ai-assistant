import { useVoiceAssistant } from "@livekit/components-react";

import * as React from "react";

export default function TranscriptionView() {
  const { agentTranscriptions } = useVoiceAssistant();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // scroll to bottom when new transcription is added
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [agentTranscriptions]);

  return (
    <div className="relative h-[200px] w-[512px] max-w-[90vw] mx-auto">
      {/* Fade-out gradient mask */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[var(--lk-bg)] to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--lk-bg)] to-transparent z-10 pointer-events-none" />

      {/* Scrollable content */}
      <div ref={containerRef} className="h-full flex flex-col gap-2 overflow-y-auto px-4 py-8">
        {agentTranscriptions.map((segment) => (
          <div
            id={segment.id}
            key={segment.id}
            className={"p-2 self-start fit-content"}
          >
            {segment.text}
          </div>
        ))}
      </div>
    </div>
  );
}