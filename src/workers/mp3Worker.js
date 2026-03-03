import lamejs from 'lamejs'

function convertFloat32ToInt16(buffer) {
  const l = buffer.length
  const buf = new Int16Array(l)
  for (let i = 0; i < l; i++) {
    let s = Math.max(-1, Math.min(1, buffer[i]))
    buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return buf
}

self.onmessage = function (e) {
  const { left, right, sampleRate, kbps, numChannels } = e.data
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps)
  const blockSize = 1152
  const mp3Data = []
  const totalSamples = left.length

  for (let i = 0; i < totalSamples; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize)
    const rightChunk = numChannels > 1 ? right.subarray(i, i + blockSize) : leftChunk
    const leftInt16 = convertFloat32ToInt16(leftChunk)
    const rightInt16 = convertFloat32ToInt16(rightChunk)
    const mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16)
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf))
    }
    const progress = Math.min(Math.round(((i + blockSize) / totalSamples) * 100), 100)
    self.postMessage({ progress })
  }

  const mp3buf = mp3encoder.flush()
  if (mp3buf.length > 0) {
    mp3Data.push(new Int8Array(mp3buf))
  }

  let totalLength = mp3Data.reduce((sum, arr) => sum + arr.length, 0)
  let result = new Uint8Array(totalLength)
  let offset = 0
  for (let arr of mp3Data) {
    result.set(arr, offset)
    offset += arr.length
  }
  self.postMessage({ result: result.buffer, done: true }, [result.buffer])
}
