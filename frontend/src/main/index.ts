import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png'
import { spawn } from 'child_process';
import pty from 'node-pty';
import axios from 'axios';
import Store from 'electron-store';
import fs from 'fs';
import kill from 'tree-kill';
import os from 'os';
import * as yaml from 'js-yaml';

const store = new Store();

let btcwalletproc = 0;
let btcwalletpid = 0;
const relayAddr = '/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN'
const bootstrapAddr1 = '/ip4/130.245.173.221/tcp/6001/p2p/12D3KooWE1xpVccUXZJWZLVWPxXzUJQ7kMqN8UQ2WLn9uQVytmdA'
const bootstrapAddr2 = '/ip4/130.245.173.222/tcp/61020/p2p/12D3KooWM8uovScE5NPihSCKhXe8sbgdJAi88i2aXT2MmwjGWoSX'
const bootstrapAddr3 = '/ip4/104.236.198.140/tcp/61000/p2p/12D3KooWFHfjDXXaYMXUigPCe14cwGaZCzodCWrQGKXUjYraoX3t' // Team Bootstrap
// const bootstrapAddresses = [
//   `${bootstrapAddr1}`,
//   `${bootstrapAddr2}`,
//   `${bootstrapAddr3}`
// ];
let bootstrapAddresses;

const pids: number[] = [];  

function getAppDataPath(appName) {
  const platform = os.platform();
  let appDataPath;

  if (platform === 'win32') {
    appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  } else if (platform === 'darwin') {
    appDataPath = path.join(os.homedir(), 'Library', 'Application Support');
  } else if (platform === 'linux') {
    appDataPath = path.join(os.homedir(), '.local', 'share');
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  return path.join(appDataPath, appName || '');
}

function getWalletAddress() {
  const procPath = path.join(process.cwd(), '../backend/btcd/btcd');
  const confPath = path.join(process.cwd(), '../backend/btcwallet.conf');
  const btcwallet = spawn(procPath, ['-C', confPath]);
}

function startWallet() {
  console.log("APP DATA: " + getAppDataPath("Btcwallet"));
  const procPath = path.join(process.cwd(), "../backend/btcwallet/btcwallet");
    const confPath = path.join(process.cwd(), '../backend/btcwallet.conf');
    const child = spawn(procPath, ['-C', confPath], {shell: true});
    btcwalletpid = child.pid;
    btcwalletproc = child;
    console.log("wallet pid:",btcwalletpid);
    child.stdout.on('data', async (data) => {
      console.log("stdout event: " + data);
      // if (data.includes('Opened wallet')) {
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
        // event.sender.send("wallet-started");
      // }
      // resolve(data);
      });
      
      child.stderr.on('data', (data) => {
        data = data.toString();
        console.error(`Error event: ${data}`);
        // reject(data);
      });
}

function startBtcd() {
  const procPath = path.join(process.cwd(), '../backend/btcd/btcd');
  const confPath = path.join(process.cwd(), '../backend/btcwallet.conf');
  const btcd = spawn(procPath, ['-C', confPath, '--notls', '--addrindex']);

  btcd.stdout.on('data', (data) => {
    console.log(`btcd stdout: ${data}`);
  });

  btcd.stderr.on('data', (data) => {
    console.log(`btcd stderr: ${data}`);
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(process.cwd(), '../backend');
    const configPath = path.join(serverPath, 'config.yml');
    const randomSeed = Math.floor(Math.random() * 900000000) + 100000000;

    const configContent = `
p2pport: 4001
rpcport: 5001
seed: "${randomSeed}"
debug: true
relayaddr: 
  - "${relayAddr}"
bootstrapaddr:
  - "${bootstrapAddr1}"
  - "${bootstrapAddr2}"
  - "${bootstrapAddr3}"
    `;

    if (!fs.existsSync(configPath)) {
      // Write the content to the config file
      fs.writeFileSync(configPath, configContent);
      console.log('Config file created:', configPath);
    } else {
      console.log('Config file already exists:', configPath);
    }

    // Read and parse the YAML config file to get the bootstrap addresses
    bootstrapAddresses = [];
    try {
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      bootstrapAddresses = config.bootstrapaddr || [];
      console.log("done")
      console.log(bootstrapAddresses)
    } catch (error) {
      console.error("Error reading or parsing config.yml:", error);
      reject(new Error("Config file parsing failed."));
      return;
    }

    const server = spawn('go', [
      'run', 
      './cmd/server',
      '--config-file', configPath,
    ], {
      cwd: serverPath,
      shell: true,
    });
    pids.push(server.pid); // Array of child processes
    console.log("server is running with pid ", server.pid);

    server.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(`server stderr: ${output}`);

      if (output.includes("Server listening on port")) {
        console.log("Server is ready!");
        resolve(data);
      }
    });

    server.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`Server exited with code ${code}, signal: ${signal}`);
        reject(new Error('Server failed to start.'));
      } else {
        console.log("Server exited successfully.");
      }
    });
  })
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
  // startServer(); 
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async() => {
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

  try {
    console.log("Starting server...");
    await startServer();
    console.log("Server is running. Starting Electron app...");
    createWindow();
  } catch (err) {
    console.error("Error starting the server:", err);
    app.quit();
  }

  ipcMain.handle('add-bootstrap', async () => {
    for (let i = 0; i < bootstrapAddresses.length; i++) {
      const bootstrapAddr = bootstrapAddresses[i];
      console.log(`Trying bootstrap address: ${bootstrapAddr}`);
      
      try {
        const response = await axios.post(`http://localhost:5001/api/v0/bootstrap/add?arg=${bootstrapAddr}`);
        console.log('Bootstrap response: ', response.data);
        return response.data;  // Stop if successful
      } catch (error) {
        console.error(`Bootstrap error (failed at ${bootstrapAddr}):`, error.message);
      }
    }
  
    console.error('All bootstrap attempts failed.');
    return { error: 'All bootstrap attempts failed.' };  // Return a failure response
  });

  ipcMain.handle('start-process', (event, command, args, inputs) => {
    return new Promise((resolve, reject) => {  
      const procPath = path.join(process.cwd(), command); 
      console.log(procPath, [args, inputs]);
      const child = spawn(procPath, args);
      // pids.push(child.pid);
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


  ipcMain.on('kill-wallet', (event) => {
    let child = btcwalletproc;
    kill(child.pid, 'SIGTERM', (err) => {
      if (err) {
        event.sender.send("wallet-killed");
        console.error("ERROR TREE-KILL: ", err);
      } else {
        console.log("terminated via TREE-KILL");
      }
    });

    child.on('exit', (code) => {
      event.sender.send("wallet-killed");
    });

  });

  ipcMain.on('start-wallet', (event) => {
    // return new Promise((resolve, reject) => {  
      // const procPath = path.join(process.cwd(), command); 
      // console.log(procPath, [args, inputs]);
      // const child = spawn("../backend/btcd/btcd", ['-C', '../backend/btcd.conf', '--notls'], {shell: true});
      const procPath = path.join(process.cwd(), "../backend/btcwallet/btcwallet");
      const confPath = path.join(process.cwd(), '../backend/btcwallet.conf');
      const child = spawn(procPath, ['-C', confPath], {shell: true});
      btcwalletpid = child.pid;
      btcwalletproc = child;
      pids.push(btcwalletpid);
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
        event.sender.send("wallet-error", data);
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

  ipcMain.on('loadwalletfile', (event, file) => {
    let appdatapath = getAppDataPath("Btcwallet") + "/mainnet/wallet.db";
    console.log("SOURCE PATH: " + file);
    console.log("DEST PATH: " + appdatapath);
    fs.rename(file, appdatapath, (copyErr) => {
      console.error("ERROR renaming file:", copyErr);
      event.sender.send('loadwallet');
      return;
    });
    event.sender.send('loadwallet');
  })

  ipcMain.on('start-btcd', (event, address) => {
    // return new Promise((resolve, reject) => {  
      // console.log("GETTING ADDRESS RN");
      console.log("starting btcd");
      const walletaddr = address;
      const procPath = path.join(process.cwd(), '../backend/btcd/btcd'); 
      const confPath = path.join(process.cwd(), '../backend/btcd.conf');
      // console.log(procPath, [args, inputs]);
      const child = spawn(procPath, ['-C', confPath, '--notls', '--txindex', '--addrindex', '--miningaddr='+walletaddr], {shell: true});
      pids.push(child.pid);
      child.stdout.on('data', async (data) => {
        console.log("stdout event: " + data);
        // if (data.includes('RPC server listening on 127.0.0.1:8334')) {
        // if (data.includes('Finished rescan')) {
        if (data.includes("Syncing to block height")) {
          console.log("here in index");
          event.sender.send("btcd-started");
        }
        if (data.includes('Block submitted via CPU miner accepted')) {
          console.log("got block rec");
          kill(btcwalletproc.pid, 'SIGTERM', (err) => {
            if (err) {
              console.error("ERROR TREE-KILL: ", err);
            } else {
              console.log("terminated via TREE-KILL");
            }
          });

          btcwalletproc.on('exit', (code) => {
            // event.sender.send("wallet-killed");
            console.log("APP DATA: " + getAppDataPath("Btcwallet"));

            startWallet();
          });

        }
      });
      
      child.stderr.on('data', (data) => {
        data = data.toString();
        console.error(`Error event: ${data}`);
      });

      child.on('close', (code) => {
        // event.sender.send("address-rec", address);
        // console.log("closing...");
        console.log(code);
      });

      child.on('exit', (code) => {
        // event.sender.send("address-rec", address);
        console.log(code);
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

  ipcMain.on('get-address', (event) => {
    // return new Promise((resolve, reject) => {  
      console.log("GETTING ADDRESS RN");
      console.log("APP DATA: " + getAppDataPath("Btcwallet"));
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
          // connect network
          const btcctlPath = path.join(process.cwd(), '../backend/btcd/cmd/btcctl/btcctl');
      const confPath2 = path.join(process.cwd(), '../backend/btcctl.conf');
      // addnode "130.245.173.221:8333" add | cat
          const btcctlchild = spawn(btcctlPath, ['--configfile='+confPath2, '--rpcuser=user', '--rpcpass=password', '--notls', 'addnode', '"130.245.173.221:8333"', "add"], { shell: true });
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

  ipcMain.on('connect-network', (event) => {
    // return new Promise((resolve, reject) => {  
      // console.log("GETTING ADDRESS RN");
      console.log("connecting to btc network");
      // const procPath = path.join(process.cwd(), '../backend/btcd/btcd'); 
      // const confPath = path.join(process.cwd(), '../backend/btcd.conf');
      const btcctlPath = path.join(process.cwd(), '../backend/btcd/cmd/btcctl/btcctl');
      const confPath = path.join(process.cwd(), '../backend/btcctl.conf');
      // addnode "130.245.173.221:8333" add | cat
      const child = spawn(btcctlPath, ['--configfile='+confPath, '--rpcuser=user', '--rpcpass=password', '--notls', 'addnode', '"130.245.173.221:8333"', "add"], { shell: true });
      // console.log(procPath, [args, inputs]);
      // const child = spawn(procPath, ['-C', confPath, '--notls'], {shell: true});
      console.log("btcnetwork pid ", child.pid);
      let address = '';
      child.stdout.on('data', async (data) => {
        console.log("stdout event: " + data);
        // if (data.includes('')) {

        // }
        // if (data.includes('New websocket client')) {
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
          // console.log("ADDRESS? : " + address);
          // child.kill();
          // kill(child.pid, 'SIGTERM', (err) => {
          //   if (err) {
          //     console.error("ERROR TREE-KILL: ", err);
          //   } else {
          //     console.log("terminated via TREE-KILL");
          //   }
          // });
        // }
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
        event.sender.send("connected-network", address);
        // console.log("EXITINGGGG");
      });
  });

  ipcMain.on('btcctlcmd', (event, args) => {
    // return new Promise((resolve, reject) => {  
      // const procPath = path.join(process.cwd(), command); 
      // console.log(procPath, [args]);
      // { shell: true }?
      console.log(args);
      for (let i=0; i<args.length; i++) {
        console.log("arg " + i + ": " + args[i]);
      }
      console.log(['--wallet', '--rpcuser=user', '--rpcpass=password', '--notls'] + args);
      const btcctlPath = path.join(process.cwd(), '../backend/btcd/cmd/btcctl/btcctl');
      // const confPath = path.join(process.cwd(), '../backend/btcctl.conf');
      const btcctlargs = [...['--wallet', '--rpcuser=user', '--rpcpass=password', '--notls'], ...args];
      console.log(btcctlargs);
      const child = spawn(btcctlPath, btcctlargs, { shell: true });

      // const transPath = path.join(process.cwd(), '../backend/transactions.json');
      // const outputFileStream = fs.createWriteStream(transPath);

      // child.stdout.pipe(outputFileStream); 
      
      // child.stderr.on('data', (data) => {
      //   data = data.toString();
      //   console.error(`Error event: ${data}`);
      //   reject(data);
      // });
      child.stderr.on('data', (err) => {
        if (!err.includes("config file")) {
          console.log("transactions error: " + err);
        }
      });
  
      child.on('close', (code) => {
        // outputFileStream.end(() => {
          if (code == 0) {
            event.sender.send('btcctl');
          } else {
            console.log("exiting with code: " + code);
            event.sender.send('btcctl');
          }
        // });
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
    

  ipcMain.on('get-transactions', (event) => {
    // return new Promise((resolve, reject) => {  
      // const procPath = path.join(process.cwd(), command); 
      // console.log(procPath, [args]);
      // { shell: true }?

      const btcctlPath = path.join(process.cwd(), '../backend/btcd/cmd/btcctl/btcctl');
      // const confPath = path.join(process.cwd(), '../backend/btcctl.conf');
      const child = spawn(btcctlPath, ['--wallet', '--rpcuser=user', '--rpcpass=password', '--notls', 'listtransactions', '"*"', "10000", "0"], { shell: true });

      const transPath = path.join(process.cwd(), '../backend/transactions.json');
      const outputFileStream = fs.createWriteStream(transPath);

      child.stdout.pipe(outputFileStream); 
      
      // child.stderr.on('data', (data) => {
      //   data = data.toString();
      //   console.error(`Error event: ${data}`);
      //   reject(data);
      // });
      child.stderr.on('data', (err) => {
        if (!err.includes("config file")) {
          console.log("transactions error: " + err);
        }
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
      const isWindows = os.platform() === "win32";
      const procPath = path.join(process.cwd(), command);
      const child = pty.spawn(procPath, ['--create'], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env,
      });
      // pids.push(child.pid);
      console.log("walletpid: ",child.pid);

      child.onData((data) => {
        console.log(data);
        if (data.includes('Enter the private passphrase')) {
          let input = `${inputs[0]}`;
          if (isWindows) input = input += "\r";
          child.write(`${input}\n`);
          // setTimeout(() => {console.log(`writing ${inputs[0]}`);child.write(`${inputs[0]}`);}, 1000);
        } else if (data.includes('Confirm passphrase:')) {
          let input = `${inputs[0]}`;
          if (isWindows) input = input += "\r";
          child.write(`${input}\n`);
        } else if (data.includes('encryption for public data?')) {
          let input = `n`;
          if (isWindows) input = input += "\r";
          child.write(`${input}\n`);
        } else if (data.includes('existing wallet seed')) {
          let input = `n`;
          if (isWindows) input = input += "\r";
          child.write(`${input}\n`);
        } else if (data.includes('wallet generation seed')) {
          let input = `OK`;
          if (isWindows) input = input += "\r";
          child.write(`${input}\n`);
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
  

  // createWindow()

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

app.on('before-quit', () => {
  pids.forEach(pid => {
    try {
      process.kill(pid, 0);
      console.log(`Attempting to kill ${pid}`)

      kill(pid, 'SIGTERM', (err) => {
        if (err) {
          console.error("error killing processes")
        }
        else{
          console.log("Processes terminated successfully")
        }
      })
    } catch(error) {
      console.error(`No process with pid ${pid} found, it might already be terminated, error`);
    }
  });
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.