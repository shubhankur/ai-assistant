'use client'
import React, { useEffect, useState } from 'react';
import ConnectRoom from '../../components/ConnectRoom';
import { LoadingView } from '@/components/LoadingView';
import { SessionAgent } from '@/components/SessionAgent';
import Intro from '@/components/Intro';
import { updateStageAtDB } from '@/utils/serverApis';
import { SERVER_URL } from '@/utils/constants';
import { DayPlan } from '@/components/DayPage';

export interface Metadata {
  stage:string,
  day: number,
  date: string,
  time: string,
  timezone: string,
  locale : string,
  isTomorrow? : string,
  currentPlan?: DayPlan,
  userId: string
}

export default function SessionPage() {
  const [metadata, setMetadata] = useState<Metadata>();
  const [userContinue, setUserContinue] = useState(false);

  const handleUserDiscontinue = async (stageNum: number) => {
    updateStageAtDB(stageNum)
    window.location.assign('/today')
  }

  const handleUserContinue = () => {
    setUserContinue(true)
  }

  useEffect(() => {
    async function init() {
        if (typeof window === 'undefined') return;
        const userRes = await fetch(`${SERVER_URL}/auth/validate`, { credentials: 'include' });
        if (!userRes.ok) { 
          window.location.assign('/login'); return; 
        }
        const user = await userRes.json();
        if(!user.verified){
          window.location.assign('/login?verify=1');
          return;
        }
        if(user.stage && user.stage != 0 && user.stage != 1) {
          window.location.assign('/today'); return;
        }
        const d = new Date();
        const metadata_created : Metadata = {
          stage:"1",
          date : d.toLocaleDateString(),
          day : d.getDay(),
          time : d.toTimeString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: "en-US",
          userId: user.id
        }
        setMetadata(metadata_created);
      }
    init();
  }, []);

  if(!metadata){
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingView centerMessage='Loading...' messages={[]}/>
      </div>
    )
  }
  return (
    <div>
      {!userContinue && (
        <Intro handleUserContinue={handleUserContinue} handleUserDiscontinue={handleUserDiscontinue}/>
      )}
      {userContinue && (
        <ConnectRoom metadata={metadata}>
          <SessionAgent />
        </ConnectRoom>
      )}
    </div>
  );
}
