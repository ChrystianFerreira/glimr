import { describe, expect, it } from 'vitest'
import exampleRoomJson from '../../../../../public/room.example.json?raw'
import { roomSchema } from './roomSchema'

function cd(id: string) {
  return {
    id,
    title: `Title ${id}`,
    artist: 'glimr',
    cover: `media/example/${id}.png`,
    audio: `media/example/${id}.wav`,
  }
}

describe('roomSchema', () => {
  it('parses a valid v1 room with three CDs and keeps their array order', () => {
    const result = roomSchema.parse({ version: 1, id: 'room-1', cds: [cd('c'), cd('a'), cd('b')] })

    expect(result.cds.map((each) => each.id)).toEqual(['c', 'a', 'b'])
  })

  it('rejects version 2 with an error naming version', () => {
    const result = roomSchema.safeParse({ version: 2, id: 'room-1', cds: [] })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['version'])
  })

  it('rejects two CDs sharing an id with an error naming the duplicate id', () => {
    const result = roomSchema.safeParse({
      version: 1,
      id: 'room-1',
      cds: [cd('a'), cd('dupe'), cd('dupe')],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['cds', 2, 'id'])
    expect(result.error?.issues[0]?.message).toContain('dupe')
  })

  it('rejects an empty-string room id', () => {
    const result = roomSchema.safeParse({ version: 1, id: '', cds: [] })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['id'])
  })

  it('accepts the committed example room', () => {
    const result = roomSchema.safeParse(JSON.parse(exampleRoomJson))

    expect(result.error?.issues).toBeUndefined()
    expect(result.data?.cds.length).toBeGreaterThanOrEqual(3)
  })
})
