interface ElectronProcessVersions {
    electron: string;
    node: string;
    chrome: string;
    [key: string]: string; // To allow other properties
  }
  
  interface Window {
    electron: {
      process: {
        versions: ElectronProcessVersions;
      };
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        // Add more IPC methods as needed
      };
    };
  }