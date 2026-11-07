import { SHELF_SLOTS } from '../../../music/shared/utils/shelfSlots'
import type { LoadRoomResult, RoomLoadError, RoomSource } from '../types/room'
import { roomSchema } from './roomSchema'

export const ROOM_SOURCES = ['/room.json', '/room.example.json'] as const

type RoomFile =
  | { status: 'missing' }
  | { status: 'found'; body: string }
  | { status: 'failed'; error: RoomLoadError }

function roomError(
  source: RoomSource,
  reason: RoomLoadError['reason'],
  message: string,
  path = '',
): RoomLoadError {
  return { reason, source, path, message }
}

async function fetchRoomFile(source: RoomSource): Promise<RoomFile> {
  try {
    const response = await fetch(source)
    const isHtml = response.headers.get('content-type')?.includes('text/html') ?? false
    if (response.status === 404 || (response.ok && isHtml)) return { status: 'missing' }
    if (!response.ok) {
      return { status: 'failed', error: roomError(source, 'unreachable', `HTTP ${response.status}`) }
    }
    return { status: 'found', body: await response.text() }
  } catch (error) {
    return { status: 'failed', error: roomError(source, 'unreachable', String(error)) }
  }
}

function parseRoom(source: RoomSource, body: string): LoadRoomResult {
  let json: unknown
  try {
    json = JSON.parse(body)
  } catch (error) {
    return { ok: false, error: roomError(source, 'invalid-json', String(error)) }
  }

  const parsed = roomSchema.safeParse(json)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: roomError(source, 'invalid-room', issue?.message ?? 'Invalid room', issue?.path.join('.')),
    }
  }

  const room = parsed.data
  if (room.cds.length > SHELF_SLOTS) {
    console.warn(`${source} has ${room.cds.length} CDs; the shelf shows the first ${SHELF_SLOTS}.`)
  }
  return { ok: true, room, shelf: room.cds.slice(0, SHELF_SLOTS), source }
}

export async function loadRoom(): Promise<LoadRoomResult> {
  for (const source of ROOM_SOURCES) {
    const file = await fetchRoomFile(source)
    if (file.status === 'failed') return { ok: false, error: file.error }
    if (file.status === 'found') return parseRoom(source, file.body)
  }
  return { ok: false, error: roomError(ROOM_SOURCES[ROOM_SOURCES.length - 1], 'unreachable', 'Not found') }
}
