import { Metadata } from "@/app/session/page";
import { AgentVisualizer } from "./AgentVisualizer";
import TranscriptionView from "./TranscriptionView";
import { useRoomContext, useVoiceAssistant, useTextStream } from "@livekit/components-react";
import { VolumeWarning } from "./VolumeWarning";
import { VoiceControlBar } from "./VoiceControlBar";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { DayPlan } from "@/components/DayPage";
import { LoadingView } from "./LoadingView";

interface BuildPlanAgentProps {
    onPlanReady: (plan: DayPlan) => void;
}

export function ModifyPlanAgent({ onPlanReady }: BuildPlanAgentProps){
    const {state} = useVoiceAssistant();
    const [informationCollected, setInformationCollected] = useState<boolean>(false)
    const {textStreams : newPlanStream} = useTextStream("new_plan");
    const {textStreams : informationCollectedStream} = useTextStream("information_collected");

    useEffect(() => {
        if (newPlanStream.length != 0) {
          const latest = newPlanStream[newPlanStream.length - 1].text;
          if(latest.toLowerCase() == "no_modification") {
            onPlanReady(null)
          }
          else {
            const parsed : DayPlan = JSON.parse(latest);
            onPlanReady(parsed);
          }
        }
    },[newPlanStream, onPlanReady])

    useEffect(() => {
        if (informationCollectedStream.length != 0) {
          const latest = informationCollectedStream[informationCollectedStream.length - 1].text;
          if(latest.toLowerCase() == "information_collected") setInformationCollected(true)
        }
    },[informationCollectedStream])

    return (
        <div>
            {informationCollected && (
                <div className='bg-black flex items-center justify-center min-h-screen'>
                    <LoadingView centerMessage="take a few deep breaths" messages={["Analyzing Current Routine...", "Analyzing Changes...", "Finding best fit...", "Preparing your plan...", "Validating the plan...", "Loading your schedule...", "Almost there..."]} />
              </div>
            )}
            {!informationCollected && (
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
                            //ToDo: Manual Routine Creation
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
        </div>
    )
}