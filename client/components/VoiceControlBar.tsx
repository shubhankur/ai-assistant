import { Track } from 'livekit-client';
import * as React from 'react';
import { BarVisualizer, TrackToggle, MediaDeviceMenu, useLocalParticipantPermissions, usePersistentUserChoices, useTrackToggle, RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

/** @beta */
export type VoiceAssistantControlBarControls = {
  microphone?: boolean;
  leave?: boolean;
};

/** @beta */
export interface VoiceAssistantControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  controls?: VoiceAssistantControlBarControls;
  /**
   * If `true`, the user's device choices will be persisted.
   * This will enables the user to have the same device choices when they rejoin the room.
   * @defaultValue true
   */
  saveUserChoices?: boolean;
}

/**
 * @example
 * ```tsx
 * <LiveKitRoom ... >
 *   <VoiceAssistantControlBar />
 * </LiveKitRoom>
 * ```
 * @beta
 */
export function VoiceControlBar({
  controls,
  saveUserChoices = true,
  onDeviceError,
  ...props
}: VoiceAssistantControlBarProps) {
  const visibleControls = { leave: true, microphone: true, ...controls };

  const localPermissions = useLocalParticipantPermissions();
  const { microphoneTrack, localParticipant } = useLocalParticipant();

  const micTrackRef: TrackReferenceOrPlaceholder = React.useMemo(() => {
    return {
      participant: localParticipant,
      source: Track.Source.Microphone,
      publication: microphoneTrack,
    };
  }, [localParticipant, microphoneTrack]);

  if (!localPermissions) {
    visibleControls.microphone = false;
  } else {
    visibleControls.microphone ??= localPermissions.canPublish;
  }

  const { saveAudioInputEnabled, saveAudioInputDeviceId } = usePersistentUserChoices({
    preventSave: !saveUserChoices,
  });

  const microphoneOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) => {
      if (isUserInitiated) {
        saveAudioInputEnabled(enabled);
      }
    },
    [saveAudioInputEnabled],
  );

  return (
    <div className='lk-agent-control-bar'>
      {visibleControls.microphone && (
        <div className="lk-button-group">
          <TrackToggle
            source={Track.Source.Microphone}
            showIcon={true}
            onChange={microphoneOnChange}
            onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Microphone, error })}
          >
            <BarVisualizer trackRef={micTrackRef} barCount={7} options={{ minHeight: 5 }} />
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="audioinput"
              onActiveDeviceChange={(_kind, deviceId) =>
                saveAudioInputDeviceId(deviceId ?? 'default')
              }
            />
          </div>
        </div>
      )}

    </div>
  );
}
