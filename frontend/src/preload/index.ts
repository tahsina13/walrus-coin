import { contextBridge, ipcRenderer  } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import fs from 'fs';
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
      // getAddress: (command, args, inputs) => ipcRenderer.invoke('get-address', command, args, inputs),
      startWallet: () => {
        return new Promise((resolve, reject) => {
          console.log("starting promise");
          ipcRenderer.once('wallet-started', () => {
            resolve(1);
          });
          ipcRenderer.once('wallet-error', (error) => {
            reject(new Error(error));
          });
          ipcRenderer.send('start-wallet');
        });
      },
      getAddress: () => {
        return new Promise((resolve, reject) => {
          console.log("STARTING PROMISE");
          ipcRenderer.once('address-rec', (_, address) => {
            console.log("ADDRESS IN INDEX: " + address);
            resolve(address);
          });

          ipcRenderer.send('get-address');
        });
      },
      getItem: (event, key) => ipcRenderer.invoke('get-store', event, key),
      getTransactions: () => {
        return new Promise((resolve, reject) => {
          ipcRenderer.once('transactions-rec', (_, filePath) => {
            console.log(process.cwd());
            fs.readFile('../backend/transactions.json', 'utf8', (err, data) => {
              if (err) {
                console.log('error reading transactions file: ' + err);
              }
                let transactions = JSON.parse(data);
                console.log('finsihed transactinosl');
                console.log(transactions);
                resolve(transactions);
            });
            // resolve(filePath);
          });

          ipcRenderer.send('get-transactions')
        });
        // ipcRenderer.invoke('get-transactions');
      },
      startBtcd: (address) => {
        return new Promise((resolve, reject) => {
          ipcRenderer.once('btcd-started', () => {
            console.log("btcd started");
            resolve(1);
          });
          ipcRenderer.send('start-btcd', address);
        });
      },
      connectNet: () => {
        return new Promise((resolve, reject) => {
          ipcRenderer.once('connected-network', () => {
            console.log("connected to network");
            resolve(1);
          });
          ipcRenderer.send('connect-network')
        });
      },
      killWallet: () => {
        return new Promise((resolve, reject) => {
          ipcRenderer.once('wallet-killed', () => {
            console.log('killed wallet');
            resolve(1);
          });
          ipcRenderer.send('kill-wallet');
        });
      },
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
