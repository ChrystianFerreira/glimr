const PROBE_TIMEOUT_MS = 5000

/**
 * Resolves whether this browser can read the file's audio metadata within 5 s; never rejects.
 * @example
 * if (!(await probeAudio(file))) showError('That file can’t be played in this browser.')
 */
export function probeAudio(file: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = document.createElement('audio')
    const finish = (playable: boolean) => {
      clearTimeout(timer)
      audio.removeEventListener('loadedmetadata', accept)
      audio.removeEventListener('error', reject)
      audio.removeAttribute('src')
      audio.load()
      URL.revokeObjectURL(url)
      resolve(playable)
    }
    const accept = () => finish(true)
    const reject = () => finish(false)
    const timer = setTimeout(reject, PROBE_TIMEOUT_MS)
    audio.addEventListener('loadedmetadata', accept)
    audio.addEventListener('error', reject)
    audio.preload = 'metadata'
    audio.src = url
  })
}
