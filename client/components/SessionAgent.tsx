import { AgentVisualizer } from '@/components/AgentVisualizer';
import {useVoiceAssistant, useTextStream, useRoomContext} from '@livekit/components-react';
import React, { useEffect, useState } from 'react';
import { DayPlan } from '@/app/today/page';
import TranscriptionView from '@/components/TranscriptionView'
import { VolumeWarning } from '@/components/VolumeWarning';
import { VoiceControlBar } from '@/components/VoiceControlBar';
import { LoadingView } from '@/components/LoadingView';
import { Button } from '@/components/ui/button';
import { updateStageAtDB } from '@/utils/serverApis';

export function SessionAgent() {
    const {state, agentAttributes, audioTrack} = useVoiceAssistant();
    console.log("state: ", state)
    const roomCtx = useRoomContext();
    const stage = Number(agentAttributes?.stage);
    console.log("stage: ", stage)
    const [prevStage, setPrevStage] = useState(0);

    const {textStreams : todayPlanStream} = useTextStream("today_plan");
    const {textStreams : tomorrowPlanStream} = useTextStream("tomorrow_plan");
    const [todayPlan, setTodayPlan] = useState<DayPlan>()
    const [tomorrowPlan, setTomorrowPlan] = useState<DayPlan>()
    
    /* ------------- whenever the daily plan arrives ----------------- */
    useEffect(() => {
      if (todayPlanStream.length != 0) {
        const latest = todayPlanStream[todayPlanStream.length - 1].text;
        const parsed : DayPlan = JSON.parse(latest);
        setTodayPlan(parsed);
      }
      else if (tomorrowPlanStream.length != 0) {
        const latest = tomorrowPlanStream[tomorrowPlanStream.length - 1].text;
        const parsed : DayPlan = JSON.parse(latest);
        setTomorrowPlan(parsed);
      }
    }, [todayPlanStream, tomorrowPlanStream]);
  
    const updateStage = (stageNum : Number) => {
        roomCtx.localParticipant.setAttributes({
          "stage":String(stageNum)
        })
        updateStageAtDB(stage)
    }

    //update stage at DB
    useEffect(() => {
      if(stage && prevStage != stage) {
        setPrevStage(stage)
        //ToDo: After stage 5, for some reason teh stage is being updated with value 1
        console.log("updating stage", stage)
        updateStageAtDB(stage)
      }
    }, [stage])

    //move to /day
    useEffect(() => {
      if (stage == 5) {
        if (todayPlan) {
          window.location.assign('/today');
        } else if (tomorrowPlan) {
          sessionStorage.setItem('currentPlan', JSON.stringify(tomorrowPlan));
          window.location.assign('/tomorrow');
        }
      }
    }, [stage, todayPlan, tomorrowPlan]);
  
    return (
      <div>
        {(!stage || stage < 5) && (
        <div className="flex flex-col items-center bg-black">
          {/* ToDo; Get device volume when media is being played and use that*/}
          <VolumeWarning volume={1} />
          <AgentVisualizer />
          <div className="text-white text-center mb-4 py-2 px-4 rounded-lg bg-gray-800/50 backdrop-blur-sm">
            {state}
          </div>
          <div className='flex justify-center'>
            <VoiceControlBar/>
            <Button variant="outline" className='bg-blue-600 ml-2'
              onClick={() => {
                window.location.assign('/today')
                return
              }}
            >
              Skip
            </Button>
          </div>
          <div className="flex-1 w-full">
            <TranscriptionView />
          </div>
        </div>
        )}
         {stage == 5 && !todayPlan && !tomorrowPlan && (
              <div className='bg-black flex items-center justify-center min-h-screen'>
                <LoadingView centerMessage="take a few deep breaths" messages={["Analyzing Current Routine...", "Analyzing Aspirations...", "Adding Lifestyle Suggestions...", "Preparing your plan...", "Validating the plan...", "Loading your schedule...", "Almost there..."]} />
              </div>
            )
          }
      </div>
    )
  }