import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png'
import { create } from 'ipfs';
const { generateKeyPairSync } = require('crypto');
import { randomBytes } from 'crypto';
import { createSign, createVerify } from 'crypto';
import { spawn } from 'child_process';
import pty from 'node-pty';
import axios from 'axios';
import Store from 'electron-store';
import fs from 'fs';
import kill from 'tree-kill';
// const kill = require('tree-kill');

const store = new Store();

function getWalletAddress() {
  const btcwallet = spawn('../backend/btcd/btcd', ['-C', '../backend/btcwallet.conf']);

}

function startBtcd() {
  const btcd = spawn('../backend/btcd/btcd', ['-C', '../backend/btcd.conf', '--notls', '--addrindex']);

  btcd.stdout.on('data', (data) => {
    console.log(`btcd stdout: ${data}`);
  });

  btcd.stderr.on('data', (data) => {
    console.log(`btcd stderr: ${data}`);
  });
}

async function startServer() {
  const server = spawn('../backend/cmd/server/server'); 

  server.stdout.on('data', (data) => {
    console.log(`server stdout: ${data}`);
  });

  // Create the host
  await axios.post('http://localhost:8080/rpc', {
    jsonrpc: '2.0',
    method: 'NodeService.CreateHost',
    params: {
      nodeId: '123456789',
      ipAddr: '0.0.0.0',
      port: 0,
      relayAddr: '/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN',
      bootstrapAddr: [
        '/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE'
      ]
    },
    id: 1
  }); 
  
  // Init dht
  await axios.post('http://localhost:8080/rpc', {
    jsonrpc: '2.0',
    method: 'DhtService.InitDht',
    id: 2
  }); 
}

// function startBtcwallet() {


//   const btcd = spawn('../backend/btcwallet/btcwallet');

//   btcd.stdout.on('data', (data) => {
//     console.log(`btcwallet stdout: ${data}`);
//   });
// }

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.maximize();

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // start btcd
  // startBtcd();
  // startBtcwallet();
  startServer(); 
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.handle('ping', () => console.log('pong'))

  ipcMain.handle('start-process', (event, command, args, inputs) => {
    return new Promise((resolve, reject) => {  
      const procPath = path.join(process.cwd(), command); 
      console.log(procPath, [args, inputs]);
      const child = spawn(procPath, args);
      let output = '';

      console.log("STARTING SOMETHING AGAIN");
      child.stdout.on('data', (data) => {
        console.log("stdout event: " + data);
        resolve(data);
      });
      
      child.stderr.on('data', (data) => {
        data = data.toString();
        console.error(`Error event: ${data}`);
        reject(data);
      });
  
      child.on('close', (code) => {
        if (code == 0) {
          resolve(output); 
        } else {
          reject(new Error(`Process exited with code: ${code}`));  
        }
      });
  
      child.on('error', (err) => {
        reject(new Error(`Failed to start process: ${err.message}`));  
      });

      if (inputs && inputs.length > 0) {
        console.log("in input");
        inputs.forEach((input, index) => {
          // child.stdin.write(input + '\n');
          console.log("input: " + input);
        });
        child.stdin.end();  
      };
    });
  });

  ipcMain.handle('get-store', (event, key) => {
    return store.get(key);
  });

  ipcMain.on('start-wallet', (event) => {
    // return new Promise((resolve, reject) => {  
      // const procPath = path.join(process.cwd(), command); 
      // console.log(procPath, [args, inputs]);
      // const child = spawn("../backend/btcd/btcd", ['-C', '../backend/btcd.conf', '--notls'], {shell: true});
      const child = spawn("../backend/btcwallet/btcwallet", ['-C', '../backend/btcwallet.conf'], {shell: true});
      child.stdout.on('data', async (data) => {
        console.log("stdout event: " + data);
        if (data.includes('Opened wallet')) {
          // const resrpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "getaccountaddress", params: ["default"]}, {
          //   auth: {
          //     username: 'user',
          //     password: 'password'
          //   },
          //   headers: {
          //     'Content-Type': 'text/plain;',
          //   },
          // });
          // console.log(resrpc);
          // address = resrpc.data.result;
          // store.set("walletaddr", resrpc.data.result);
          // console.log("ADDRESS? : " + address);
          // event.sender.send("address-rec", resrpc.data.result);
          // child.kill();
          event.sender.send("wallet-started");
        }
        // resolve(data);
      });
      
      child.stderr.on('data', (data) => {
        data = data.toString();
        console.error(`Error event: ${data}`);
        // reject(data);
      });

      // child.on('close', (code) => {
      // });
  
      // child.on('close', (code) => {
      //   if (code == 0) {
      //     resolve(output); 
      //   } else {
      //     reject(new Error(`Process exited with code: ${code}`));  
      //   }
      // });
  
      // child.on('error', (err) => {
      //   reject(new Error(`Failed to start process: ${err.message}`));  
      // });

      // if (inputs && inputs.length > 0) {
      //   console.log("in input");
      //   inputs.forEach((input, index) => {
      //     // child.stdin.write(input + '\n');
      //     console.log("input: " + input);
      //   });
      //   child.stdin.end();  
      // };
    // });
  });

  ipcMain.on('get-address', (event) => {
    // return new Promise((resolve, reject) => {  
      console.log("GETTING ADDRESS RN");
      const procPath = path.join(process.cwd(), '../backend/btcd/btcd'); 
      const confPath = path.join(process.cwd(), '../backend/btcd.conf');
      // console.log(procPath, [args, inputs]);
      const child = spawn(procPath, ['-C', confPath, '--notls'], {shell: true});
      let address = '';
      child.stdout.on('data', async (data) => {
        console.log("stdout event: " + data);
        if (data.includes('New websocket client')) {
          const resrpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "getaccountaddress", params: ["default"]}, {
            auth: {
              username: 'user',
              password: 'password'
            },
            headers: {
              'Content-Type': 'text/plain;',
            },
          });
          console.log(resrpc);
          address = resrpc.data.result;
          console.log("ADDRESS? : " + address);
          // child.kill();
          kill(child.pid, 'SIGTERM', (err) => {
            if (err) {
              console.error("ERROR TREE-KILL: ", err);
            } else {
              console.log("terminated via TREE-KILL");
            }
          });
        }
      });
      
      child.stderr.on('data', (data) => {
        data = data.toString();
        console.error(`Error event: ${data}`);
      });

      child.on('close', (code) => {
        // event.sender.send("address-rec", address);
        console.log("closing...");
      });

      child.on('exit', (code) => {
        event.sender.send("address-rec", address);
        // console.log("EXITINGGGG");
      });
  
      // child.on('close', (code) => {
      //   if (code == 0) {
      //     resolve(output); 
      //   } else {
      //     reject(new Error(`Process exited with code: ${code}`));  
      //   }
      // });
  
      // child.on('error', (err) => {
      //   reject(new Error(`Failed to start process: ${err.message}`));  
      // });

      // if (inputs && inputs.length > 0) {
      //   console.log("in input");
      //   inputs.forEach((input, index) => {
      //     // child.stdin.write(input + '\n');
      //     console.log("input: " + input);
      //   });
      //   child.stdin.end();  
      // };
    // });
  });
    

  ipcMain.on('get-transactions', (event) => {
    // return new Promise((resolve, reject) => {  
      // const procPath = path.join(process.cwd(), command); 
      // console.log(procPath, [args]);
      // { shell: true }?
      const child = spawn('../backend/btcd/cmd/btcctl/btcctl', ['--wallet', 'listtransactions', '"*"', "10000", "0"], { shell: true });

      const outputFileStream = fs.createWriteStream('../backend/transactions.json');

      child.stdout.pipe(outputFileStream); 
      
      // child.stderr.on('data', (data) => {
      //   data = data.toString();
      //   console.error(`Error event: ${data}`);
      //   reject(data);
      // });
      child.stderr.on('data', (err) => {
        console.log("TRANSACT ERROR:" + err);
      });
  
      child.on('close', (code) => {
        outputFileStream.end(() => {
          if (code == 0) {
            event.sender.send('transactions-rec', '../backend/transactions');
          } else {
            console.log("exiting with code: " + code);
            event.sender.send('transactions-rec', 'hey');
          }
        });
        // if (code == 0) {
        //   resolve(output); 
        // } else {
        //   reject(new Error(`Process exited with code: ${code}`));  
        // }
      });
  
      // child.on('error', (err) => {
      //   reject(new Error(`Failed to start process: ${err.message}`));  
      // });

    // });
  });

  ipcMain.handle('create-wallet', (event, command, args, inputs) => {
      const procPath = path.join(process.cwd(), command);
      const child = pty.spawn(procPath, ['--create'], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env,
      });

      child.onData((data) => {
        console.log(data);
        if (data.includes('Enter the private passphrase')) {
          child.write(`${inputs[0]}\n`);
          // setTimeout(() => {console.log(`writing ${inputs[0]}`);child.write(`${inputs[0]}`);}, 1000);
        } else if (data.includes('Confirm passphrase:')) {
          child.write(`${inputs[0]}\n`);
        } else if (data.includes('encryption for public data?')) {
          child.write('n\n');
        } else if (data.includes('existing wallet seed')) {
          child.write('n\n');
        } else if (data.includes('wallet generation seed')) {
          child.write('OK\n');
        }
      });


      child.onExit((code) => {
        console.log(code);
      });
  });

  
  // ipcMain.handle('create-wallet', (event, command, args, inputs) => {
  //   return new Promise((resolve, reject) => {  
  //     const procPath = path.join(process.cwd(), command); 
  //     console.log(procPath, args);
  //     const child = spawn(procPath, ['--create']);  
  //     let output = '';  
      
  //     child.stdout.on('data', (data) => {
  //       output += data.toString();
  //       resolve([child, output]);
  //     });
  
  //     child.stderr.on('data', (data) => {
  //       console.error(`Error: ${data}`);
  //       reject(data);
  //     });
  
  //     child.on('close', (code) => {
  //       if (code == 0) {
  //         resolve(output); 
  //       } else {
  //         reject(new Error(`Process exited with code: ${code}`));  
  //       }
  //     });
  
  //     child.on('error', (err) => {
  //       reject(new Error(`Failed to start process: ${err.message}`));  
  //     });

  //     if (inputs && inputs.length > 0) {
  //       inputs.forEach((input, index) => {
  //         child.stdin.write(input + '\n'); 
  //       });
  //       child.stdin.end();  
  //     };
  //   });
  // });

  // ipcMain.handle('com-process', (event, child, input) => {
  //   return new Promise((resolve, reject) => {  
      
  //     let output = '';

  //     child.stdin.write(`${input}\n`);
  //     resolve(void);
  //     // child.stdout.on('data', (data) => {
  //     //   output += data.toString();
  //     //   resolve([child, output]);
  //     // });
  
  //     // child.stderr.on('data', (data) => {
  //     //   console.error(`Error: ${data}`);
  //     //   resolve(data);
  //     // });
  
  //     // child.on('close', (code) => {
  //     //   if (code == 0) {
  //     //     resolve(output); 
  //     //   } else {
  //     //     reject(new Error(`Process exited with code: ${code}`));  
  //     //   }
  //     // });
  
  //     // child.on('error', (err) => {
  //     //   reject(new Error(`Failed to start process: ${err.message}`));  
  //     // });

  //     // if (inputs && inputs.length > 0) {
  //     //   inputs.forEach((input, index) => {
  //     //     child.stdin.write(input + '\n'); 
  //     //   });
  //     //   child.stdin.end();  
  //     // };
  //   });
  // });
  

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.