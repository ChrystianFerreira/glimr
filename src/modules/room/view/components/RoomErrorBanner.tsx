import { useRoomStore } from '../hooks/useRoomStore'

const REASON_LABELS = {
  unreachable: "Couldn't fetch the file",
  'invalid-json': 'The file is not valid JSON',
  'invalid-room': "The file doesn't match the room format",
}

export function RoomErrorBanner() {
  const load = useRoomStore((state) => state.load)
  if (load.status !== 'error') return null

  const { reason, source, path, message } = load.error
  return (
    <div className="room-error-banner" role="alert">
      <strong>Couldn't load your room</strong>
      <dl>
        <dt>Reason</dt>
        <dd>{REASON_LABELS[reason]}</dd>
        <dt>File</dt>
        <dd>
          <code>{source}</code>
        </dd>
        {path && (
          <>
            <dt>Field</dt>
            <dd>
              <code>{path}</code>
            </dd>
          </>
        )}
        <dt>Details</dt>
        <dd>{message}</dd>
      </dl>
    </div>
  )
}
