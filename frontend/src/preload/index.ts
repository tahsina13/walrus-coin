import { contextBridge, ipcRenderer  } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('versions', {
      ping: () => ipcRenderer.invoke('ping'),
      startProcess: (command, args, inputs) => ipcRenderer.invoke('start-process', command, args, inputs),
      createWallet: (command, args, inputs) => ipcRenderer.invoke('create-wallet', command, args, inputs),
      getAddress: (command, args, inputs) => ipcRenderer.invoke('get-address', command, args, inputs),
      getItem: (event, key) => ipcRenderer.invoke('get-store', event, key)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
