'use client'
import React, { useEffect, useState } from 'react';
import {useVoiceAssistant, useTextStream, useRoomContext} from '@livekit/components-react';
import ConnectRoom from '../../components/ConnectRoom';
import TranscriptionView from '@/components/TranscriptionView'
import { BarVisualizer, RoomAudioRenderer } from '@livekit/components-react';
import { VolumeWarning } from '@/components/VolumeWarning';
import { VoiceControlBar } from '@/components/VoiceControlBar';
import { LoadingView } from '@/components/LoadingView';
import { Button } from '@/components/ui/button';
import { DayPlan } from '../day/page';

export interface Metadata {
  stage:string,
  feelings:string | null,
  day: number,
  date: string,
  time: string,
  timezone: string,
  locale : string
}

function SessionContent() {
  const {state, agentAttributes, audioTrack} = useVoiceAssistant();
  console.log("state: ", state)
  const roomCtx = useRoomContext();
  console.log("room local participant: ", roomCtx.localParticipant.identity)
  const stage = Number(agentAttributes?.stage ?? 1);

  const {textStreams : todayPlanStream} = useTextStream("today_plan");
  const {textStreams : tomorrowPlanStream} = useTextStream("tomorrow_plan");

  const [todayPlan, setTodayPlan] = useState<DayPlan>()
  const [tomorrowPlan, setTomorrowPlan] = useState<DayPlan>()
  /* ------------- whenever the daily plan arrives ----------------- */
  useEffect(() => {
    if (todayPlanStream.length != 0) {
      const latest = todayPlanStream[todayPlanStream.length - 1].text;
      const parsed : DayPlan = JSON.parse(latest);
      parsed.date = new Date().toDateString();
      setTodayPlan(parsed);
    }
    else if (tomorrowPlanStream.length != 0) {
      const latest = tomorrowPlanStream[tomorrowPlanStream.length - 1].text;
      const parsed : DayPlan = JSON.parse(latest);
      parsed.date = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString();
      setTomorrowPlan(parsed);
    }
  }, [todayPlanStream, tomorrowPlanStream]);

  console.log("stage", stage)

  const updateStage = (stageNum : Number) => {
      roomCtx.localParticipant.setAttributes({
        "stage":String(stageNum)
      })
      console.log("sending stage", roomCtx.localParticipant.attributes.stage)
  }

  useEffect(() => {
    if (stage === 5) {
      if (todayPlan) {
        sessionStorage.setItem('currentPlan', JSON.stringify(todayPlan));
        window.location.assign('/day');
      } else if (tomorrowPlan) {
        sessionStorage.setItem('currentPlan', JSON.stringify(tomorrowPlan));
        window.location.assign('/day');
      }
    }
  }, [stage, todayPlan, tomorrowPlan]);

  return (
    <div className="flex flex-col items-center bg-black">
      {/* ToDo; Get device volume when media is being played and use that*/}
      <VolumeWarning volume={1} />
      <AgentVisualizer />
      <div className='flex justify-center'>
        <VoiceControlBar/>
        <Button variant="outline" className='bg-blue-600 ml-2'
          onClick={() => updateStage(7)}
        >
          Skip
        </Button>
      </div>

      {/* {stage == 2 && 
        (
          <div>
            <Button variant="outline" className='bg-blue-600'
              onClick={() => updateStage(3)}>
                I have 5 uninterrupted minutes
            </Button>
          </div>
        )
      } */}
      
      {stage < 5 &&
        (
          <div className="flex-1 w-full">
            <TranscriptionView />
          </div>
        )}

      {stage == 5 && (
        (!todayPlan && !tomorrowPlan) ? (
          <LoadingView messages={["Analyzing Current Routine", "Analyzing Aspirations", "Preparing your plan", "Loading your schedule..."]} />
        ) : null
      )}

    </div>
  )
}

function AgentVisualizer() {
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
        >
        </BarVisualizer>      
      </div>
      <RoomAudioRenderer/>
    </>

  );
}

export default function SessionPage() {
  const [metadata, setMetadata] = useState<Metadata>();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params: URLSearchParams = new URLSearchParams(window.location.search);
      const d = new Date();
      const metadata_created : Metadata = {
        stage:"1",
        feelings: params.get('feelings'),
        date : d.toLocaleDateString(),
        day : d.getDay(),
        time : d.toTimeString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      }
      setMetadata(metadata_created);
    }
  }, []);
  if(!metadata){
    return (
      <div>
        connecting...
      </div>
    )
  }
  return (
    <ConnectRoom metadata={metadata}>
      <SessionContent />
    </ConnectRoom>
  );
}
