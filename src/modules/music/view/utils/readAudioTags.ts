/**
 * Resolves to the file's title and artist tags, or to its name without the extension and a blank artist; never rejects.
 * @example
 * const { title, artist } = await readAudioTags(file)
 */
export async function readAudioTags(file: File): Promise<{ title: string; artist: string }> {
  const fallback = { title: file.name.replace(/\.[^.]+$/, ''), artist: '' }
  try {
    const { parseBlob } = await import('music-metadata')
    const { common } = await parseBlob(file, { skipCovers: true, duration: false })
    return { title: common.title || fallback.title, artist: common.artist ?? fallback.artist }
  } catch {
    return fallback
  }
}
