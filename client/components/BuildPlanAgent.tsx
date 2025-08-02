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

export const buildPlanMetadata : Metadata = {
    stage : '10',
    date: new Date().toLocaleDateString(),
    day: new Date().getDay(),
    time: new Date().toTimeString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: "",
    userId: ""
}

interface BuildPlanAgentProps {
    onPlanReady: (plan: DayPlan) => void;
}

export function BuildPlanAgent({ onPlanReady }: BuildPlanAgentProps){
    const {state} = useVoiceAssistant();
    const [informationCollected, setInformationCollected] = useState<boolean>(false)
    const {textStreams : todayPlanStream} = useTextStream("day_plan");
    const {textStreams : informationCollectedStream} = useTextStream("information_collected");

    useEffect(() => {
        if (todayPlanStream.length != 0) {
          const latest = todayPlanStream[todayPlanStream.length - 1].text;
          const parsed : DayPlan = JSON.parse(latest);
          onPlanReady(parsed);
        }
    },[todayPlanStream, onPlanReady])

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
                    <LoadingView centerMessage="take a few deep breaths" messages={["Analyzing Current Routine...", "Analyzing Aspirations...", "Adding Lifestyle Suggestions...", "Preparing your plan...", "Validating the plan...", "Loading your schedule...", "Almost there..."]} />
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