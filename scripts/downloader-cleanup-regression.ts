import assert from 'assert'
import fs from 'fs'

const { cleanupDownloadedTempFile } = require('../src/core/downloader') as {
  cleanupDownloadedTempFile: (rawFile: string) => void
}

const originalUnlinkSync = fs.unlinkSync

try {
  let logged = false
  fs.unlinkSync = (() => {
    throw new Error('EPERM: operation not permitted')
  }) as typeof fs.unlinkSync
  console.error = ((..._args: unknown[]) => {
    logged = true
  }) as typeof console.error

  assert.doesNotThrow(() => cleanupDownloadedTempFile('/tmp/ytdl_dl_test.mp4'))
  assert.equal(logged, true)
} finally {
  fs.unlinkSync = originalUnlinkSync
}
