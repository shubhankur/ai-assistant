'use client'
import React, { useEffect, useState } from 'react';
import ConnectRoom from '../../components/ConnectRoom';
import { LoadingView } from '@/components/LoadingView';
import { SessionAgent } from '@/components/SessionAgent';
import Intro from '@/components/Intro';
import { updateStageAtDB } from '@/utils/serverApis';
import { SERVER_URL } from '@/utils/constants';

export interface Metadata {
  stage:string,
  day: number,
  date: string,
  time: string,
  timezone: string,
  locale : string,
  userId: string
}

export default function SessionPage() {
  const [metadata, setMetadata] = useState<Metadata>();
  const [userContinue, setUserContinue] = useState(false);

  const handleUserDiscontinue = async (stageNum: number) => {
    updateStageAtDB(stageNum)
    window.location.assign("/day")
  }

  const handleUserContinue = () => {
    setUserContinue(true)
  }

  useEffect(() => {
    async function init() {
        if (typeof window === 'undefined') return;
        const userRes = await fetch(`${SERVER_URL}/auth/validate`, { credentials: 'include' });
        if (!userRes.ok) { 
          window.location.assign('/'); return; 
        }
        const user = await userRes.json();
        if(!user.verified){
          await fetch(`${SERVER_URL}/auth/resend-code`, { method: 'POST', credentials: 'include' });
          window.location.assign('/?verify=1');
          return;
        }
        if(user.stage && user.stage != 1) {
          window.location.assign('/day'); return; 
        }
        const d = new Date();
        const metadata_created : Metadata = {
          stage:"1",
          date : d.toLocaleDateString(),
          day : d.getDay(),
          time : d.toTimeString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: Intl.DateTimeFormat().resolvedOptions().locale,
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
