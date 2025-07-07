'use client'
import { useEffect, useState } from 'react';
import { BarVisualizer, DisconnectButton, VoiceAssistantControlBar, useVoiceAssistant, useTextStream, useTrackToggle, RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';
import { NoAgentNotification } from "@/components/NoAgentNotification";
import ConnectRoom from '../../components/ConnectRoom';
import TranscriptionView from '@/components/TranscriptionView'
import WeeklyRoutineTimeline, { WeekData } from '@/components/WeeklyRoutine';
import { AnimatePresence, motion } from "framer-motion";
// import { AnchorsDashboard, Anchor } from '@/components/AnchorsDashboard';
import { RoutineSummary } from '@/components/RoutineSummary';
import { SuggestionList } from '@/components/SuggestionList';

function SessionContent() {
  const {state: agentState, agentAttributes} = useVoiceAssistant();
  console.log("state: ", agentState)
  const stage = Number(agentAttributes?.stage ?? 1);

  const { textStreams: suggestedChangesStreams } = useTextStream("suggestion_list");
  const { textStreams: routineSummaryStream } = useTextStream("routine_preview");
  const { textStreams: weekStreams }   = useTextStream("weekly_routine"); 

  const [suggestedChanges, setSuggestedChanges] = useState()
  // const [anchors, setAnchors] = useState<Anchor[]>([])
  const [routineSummary, setRoutineSummary] = useState()
  const [weekData, setWeekData] = useState<WeekData>()

  /* ------------- whenever the suggested changes arrives ----------------- */
  useEffect(() => {
    if (suggestedChangesStreams.length === 0) return;
    const latest = suggestedChangesStreams[suggestedChangesStreams.length - 1].text;
    console.log("suggested changes", latest)
    if (!latest) return;

    try {
      const parsed = JSON.parse(latest);
      console.log("suggested changes parsed", parsed)
      setSuggestedChanges(parsed)
    } catch (e) {
      console.error("failed to parse anchors payload", e);
    }
  }, [suggestedChangesStreams]);

  /* ------------- whenever the routine summary arrives ----------------- */
  useEffect(() => {
    if (routineSummaryStream.length === 0) return;
    const latest = routineSummaryStream[routineSummaryStream.length - 1].text;
    console.log("routine_summary", latest)
    if (!latest) return;

    try {
      const parsed = JSON.parse(latest);
      console.log("routine_summary_parsed", parsed)
      setRoutineSummary(parsed)
    } catch (e) {
      console.error("failed to parse anchors payload", e);
    }
  }, [routineSummaryStream]);

  /* ------------- whenever the final weekly grid arrives ----------------- */
  useEffect(() => {
    if (weekStreams.length === 0) return;
    const latest = weekStreams[weekStreams.length - 1].text;
    console.log("weekStreams", latest)
    if (!latest) return;

    try {
      const parsed = JSON.parse(latest);
      console.log("weekStreams_parsed", parsed)
      if (parsed.days) setWeekData(parsed as WeekData);
    } catch (e) {
      console.error("failed to parse weekData payload", e);
    }
  }, [weekStreams]);

  console.log("stage", stage)
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
            {stage < 4 && 
            (
              <div className="flex-1 w-full">
                <TranscriptionView />
              </div>
            )}

            {stage == 4 &&
              <SuggestionList data = {suggestedChanges} />
            }   

            {stage == 5 &&
              <RoutineSummary data = {routineSummary} />
            }

            {stage == 6 && weekData &&
              <WeeklyRoutineTimeline data = {weekData} />
            }
            
            <RoomAudioRenderer />
            <NoAgentNotification state={agentState} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, top: "1px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-1px" }}
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
