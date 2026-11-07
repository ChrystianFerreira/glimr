import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadRoom } from './loadRoom'

function cd(id: string) {
  return {
    id,
    title: `Title ${id}`,
    artist: 'glimr',
    cover: `media/example/${id}.png`,
    audio: `media/example/${id}.wav`,
  }
}

const exampleRoom = { version: 1, id: 'example', cds: [cd('a'), cd('b'), cd('c')] }

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function serve(routes: Record<string, () => Response>) {
  const fetchStub = vi.fn(async (url: string) => routes[url]?.() ?? new Response('', { status: 404 }))
  vi.stubGlobal('fetch', fetchStub)
  return fetchStub
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('loadRoom', () => {
  it('falls back to /room.example.json when /room.json is a 404', async () => {
    serve({ '/room.example.json': () => jsonResponse(exampleRoom) })

    const result = await loadRoom()

    expect(result.ok).toBe(true)
    expect(result.ok && result.room.id).toBe('example')
  })

  it('falls back to /room.example.json when /room.json comes back as the dev server HTML page', async () => {
    serve({
      '/room.json': () =>
        new Response('<!doctype html><html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
      '/room.example.json': () => jsonResponse(exampleRoom),
    })

    const result = await loadRoom()

    expect(result.ok).toBe(true)
    expect(result.ok && result.room.id).toBe('example')
  })

  it('returns a parse error for malformed JSON and does not fall back', async () => {
    const fetchStub = serve({
      '/room.json': () =>
        new Response('{ "version": 1, ', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      '/room.example.json': () => jsonResponse(exampleRoom),
    })

    const result = await loadRoom()

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.reason).toBe('invalid-json')
    expect(!result.ok && result.error.source).toBe('/room.json')
    expect(fetchStub).not.toHaveBeenCalledWith('/room.example.json')
  })

  it('returns unreachable for a non-404 HTTP error on /room.json and does not fall back', async () => {
    const fetchStub = serve({
      '/room.json': () => new Response('boom', { status: 500 }),
      '/room.example.json': () => jsonResponse(exampleRoom),
    })

    const result = await loadRoom()

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toMatchObject({
      reason: 'unreachable',
      source: '/room.json',
      message: 'HTTP 500',
    })
    expect(fetchStub).not.toHaveBeenCalledWith('/room.example.json')
  })

  it('returns unreachable when fetching /room.json rejects and does not fall back', async () => {
    const fetchStub = serve({ '/room.example.json': () => jsonResponse(exampleRoom) })
    fetchStub.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const result = await loadRoom()

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.reason).toBe('unreachable')
    expect(!result.ok && result.error.source).toBe('/room.json')
    expect(!result.ok && result.error.message).toContain('Failed to fetch')
    expect(fetchStub).not.toHaveBeenCalledWith('/room.example.json')
  })

  it('returns Not found against /room.example.json when both sources are 404', async () => {
    const fetchStub = serve({})

    const result = await loadRoom()

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toMatchObject({
      reason: 'unreachable',
      source: '/room.example.json',
      message: 'Not found',
    })
    expect(fetchStub).toHaveBeenCalledTimes(2)
  })

  it('returns invalid-room with the failing path for a schema-invalid room and does not fall back', async () => {
    const fetchStub = serve({
      '/room.json': () => jsonResponse({ ...exampleRoom, version: 2 }),
      '/room.example.json': () => jsonResponse(exampleRoom),
    })

    const result = await loadRoom()

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.reason).toBe('invalid-room')
    expect(!result.ok && result.error.source).toBe('/room.json')
    expect(!result.ok && result.error.path).toBe('version')
    expect(fetchStub).not.toHaveBeenCalledWith('/room.example.json')
  })

  it('reports the nested path of a duplicate CD id as invalid-room', async () => {
    serve({ '/room.json': () => jsonResponse({ ...exampleRoom, cds: [cd('a'), cd('a')] }) })

    const result = await loadRoom()

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.reason).toBe('invalid-room')
    expect(!result.ok && result.error.path).toBe('cds.1.id')
  })

  it('parses thirteen CDs but slots only the first 12, with one console warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ids = Array.from({ length: 13 }, (_, index) => `cd-${index + 1}`)
    serve({ '/room.json': () => jsonResponse({ version: 1, id: 'big', cds: ids.map(cd) }) })

    const result = await loadRoom()

    expect(result.ok).toBe(true)
    expect(result.ok && result.room.cds).toHaveLength(13)
    expect(result.ok && result.shelf.map((each) => each.id)).toEqual(ids.slice(0, 12))
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
