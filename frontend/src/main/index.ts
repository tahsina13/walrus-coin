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

let ipfs: any;

async function initIPFS() {
  try {
    ipfs = await create();
    console.log("IPFS node is ready")
  }
  catch (error) {
    console.log("error: ", error)
  }
}

async function getIPFSIdentity() {
  try {
    const identity = await ipfs.id();
    console.log("Node Identity:", identity);
  } catch (error) {
    console.error("Error retrieving identity:", error);
  }
}

function generateKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { publicKey: publicKey.export({ type: 'spki', format: 'pem' }), privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }) };
}

async function login(publicKey, privateKey) {
  // Generate a challenge
  const challenge = randomBytes(32).toString('hex');
  
  // Sign the challenge
  const sign = createSign('SHA256');
  sign.update(challenge);
  const signature = sign.sign(privateKey, 'hex');

  return { challenge, signature }; // Send this to the server
}

async function verifyLogin(publicKey, signature, challenge) {
  const verify = createVerify('SHA256');
  verify.update(challenge);
  const isVerified = verify.verify(publicKey, signature, 'hex');
  
  if (isVerified) {
    console.log("Login successful!");
  } else {
    console.log("Login failed!");
  }
  return isVerified;
}


// async function generateKeyPair() {
//   const privateKey = randomBytes(32).toString('hex');
//   const publicKey = generatePublicKey(privateKey);
//   return { privateKey, publicKey };
// }

// async function generatePublicKey(privateKey: String){

// }

async function uploadFile(file:Buffer) {
  const { path } = await ipfs.add(file);
  console.log(`${file} uploaded to IPFS with path: ${path}`)
  return path;
}

async function downloadFile(cid:String) {
  const stream = ipfs.cat(cid);
  let data = '';

  for await (const chunk of stream) {
    data += chunk.toString();
  }

  console.log(`File downloaded from IPFS: ${data}`);
  return data;
}

function startBtcd() {
  const btcd = spawn('../backend/btcd/btcd');

  btcd.stdout.on('data', (data) => {
    console.log(`btcd stdout: ${data}`);
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
  startBtcd();
  // startBtcwallet();
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

  initIPFS().then(getIPFSIdentity);

  ipcMain.on('register', (event) => {
    const keys = generateKeys();
    event.reply('registration-result', { publicKey: keys.publicKey });
  });
  
  ipcMain.on('login', async (event, { publicKey, privateKey }) => {
    const { challenge, signature } = await login(publicKey, privateKey);
    
    const isVerified = await verifyLogin(publicKey, signature, challenge);
    event.reply('login-result', { success: isVerified });
  });
  

  ipcMain.on('upload-file', async (event, file) => {
    try {
      const cid = await uploadFile(file);
      event.reply('file-uploaded', cid);
    }
    catch (error) {
      console.log('Upload failed: ', error)
      event.reply('file-upload-error', error.message)
    }
  })


  // IPC test
  ipcMain.handle('ping', () => console.log('pong'))

  ipcMain.handle('start-process', (event, command, args, inputs) => {
    return new Promise((resolve, reject) => {  
      const procPath = path.join(process.cwd(), command); 
      console.log(procPath, [args, inputs]);
      const child = spawn(procPath, args);
      let output = '';

      child.stdout.on('data', (data) => {
        console.log("stdout: " + data);
        resolve(data);
      });
      
      child.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
        resolve(data);
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
        console.error("exiting");
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