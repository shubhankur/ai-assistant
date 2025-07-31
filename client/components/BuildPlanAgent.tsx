import { Metadata } from "@/app/session/page";
import { AgentVisualizer } from "./AgentVisualizer";
import TranscriptionView from "./TranscriptionView";
import { useRoomContext, useVoiceAssistant } from "@livekit/components-react";
import { VolumeWarning } from "./VolumeWarning";
import { VoiceControlBar } from "./VoiceControlBar";
import { Button } from "./ui/button";

export const buildPlanMetadata : Metadata = {
    stage : '10',
    date: new Date().toLocaleDateString(),
    day: new Date().getDay(),
    time: new Date().toTimeString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: "",
    userId: ""
}

export function BuildPlanAgent(){
    const {state} = useVoiceAssistant();
    const room = useRoomContext()
    return (
        <div>
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
        </div>
    )
}