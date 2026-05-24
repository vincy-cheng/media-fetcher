// client/src/api/client.ts
// client/src/api/client.ts
import { TauriApiClient } from './TauriApiClient'
import { WebApiClient } from './WebApiClient'
export type { UnlistenFn, Capabilities } from './IApiClient'

function isTauri(): boolean {
  return Boolean((globalThis as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
}

const impl = isTauri() ? new TauriApiClient() : new WebApiClient()

export const capabilities = impl.capabilities
export const getVideoInfo = impl.getVideoInfo.bind(impl)
export const extractPreviewAudio = impl.extractPreviewAudio.bind(impl)
export const downloadMedia = impl.downloadMedia.bind(impl)
export const cancelDownload = impl.cancelDownload.bind(impl)
export const onDownloadProgress = impl.onDownloadProgress.bind(impl)
export const onDownloadComplete = impl.onDownloadComplete.bind(impl)
export const getSettings = impl.getSettings.bind(impl)
export const saveSettings = impl.saveSettings.bind(impl)
export const checkToolsStatus = impl.checkToolsStatus.bind(impl)
export const checkYtdlpUpdate = impl.checkYtdlpUpdate.bind(impl)
export const updateYtdlp = impl.updateYtdlp.bind(impl)
export const onUpdateProgress = impl.onUpdateProgress.bind(impl)
