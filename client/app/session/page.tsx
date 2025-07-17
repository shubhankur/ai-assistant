'use client'
import { useEffect, useState, useRef } from 'react';
import { BarVisualizer, useVoiceAssistant, useTextStream, RoomAudioRenderer} from '@livekit/components-react';
import ConnectRoom from '../../components/ConnectRoom';
import TranscriptionView from '@/components/TranscriptionView'
import WeeklyRoutinePreview, { RoutineData } from '@/components/WeeklyRoutine';
import { RoutineSummary } from '@/components/RoutineSummary';
import { SuggestionList } from '@/components/SuggestionList';
import { VolumeWarning } from '@/components/VolumeWarning';
import { VoiceControlBar } from '@/components/VoiceControlBar';

function SessionContent() {
  const {state, agentAttributes, audioTrack} = useVoiceAssistant();
  console.log("state: ", state)
  const stage = Number(agentAttributes?.stage ?? 1);

  const { textStreams: suggestedChangesStreams } = useTextStream("suggestion_list");
  const { textStreams: routineSummaryStream } = useTextStream("routine_preview");
  const { textStreams: weekStreams }   = useTextStream("weekly_routine"); 

  const [suggestedChanges, setSuggestedChanges] = useState()
  // const [anchors, setAnchors] = useState<Anchor[]>([])
  const [routineSummary, setRoutineSummary] = useState()
  const [weekData, setWeekData] = useState<RoutineData>()

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
      if (parsed.days) setWeekData(parsed as RoutineData);
    } catch (e) {
      console.error("failed to parse weekData payload", e);
    }
  }, [weekStreams]);

  console.log("stage", stage)
  return (
    <div className="relative flex flex-col w-full h-full items-center">
      {/* ToDo; Get device volume when media is being played and use that*/}
      <VolumeWarning volume={1} />

      {/* ToDo: Add a skip or continue later button */}

      <AgentVisualizer />
      {stage < 4 &&
        (
          <div className="flex-1 w-full">
            <TranscriptionView />
          </div>
        )}

      {stage == 4 && suggestedChanges &&
        <SuggestionList data={suggestedChanges} />
      }

      {stage == 5 && routineSummary &&
        <RoutineSummary data={routineSummary} />
      }

      {stage == 6 && weekData &&
        /* ToDo; Button: is this routine okay or very wrong */
        <WeeklyRoutinePreview data={weekData} />
      }

      <RoomAudioRenderer />
      {/* <NoAgentNotification state={state} /> */}
      <VoiceControlBar controls={{ leave: false }} />

    </div>
  )
}

function AgentVisualizer() {
  const { state: agentState, audioTrack } = useVoiceAssistant();
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
