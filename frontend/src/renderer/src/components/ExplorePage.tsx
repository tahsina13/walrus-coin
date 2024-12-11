import axios from "axios";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import { LoadingButton } from '@mui/lab';
import ConfirmationDialog from "./ConfirmationDialog";

function ExplorePage(): JSX.Element {
  return (
    <div>
      <SearchBar />
    </div>
  );
}

function SearchBar(): JSX.Element {
  const [hash, setHash] = useState<string>('');
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Disable search until bootstrap peer is added
  useEffect(() => {
    const buttonState = sessionStorage.getItem("buttonState");
    if (buttonState === "disabled") {
      setIsButtonDisabled(true);
    } else {
      setIsButtonDisabled(false);
    }
  }, []);

  // Checks if bootstrap is added and dynamically refresh, clears when finished
  useEffect(() => {
    const interval = setInterval(() => {
      const buttonState = sessionStorage.getItem("buttonState");

      if (buttonState === "disabled") {
        setIsButtonDisabled(true);
      } else {
        setIsButtonDisabled(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    setHash(e.target.value);
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    console.log("Search: " + hash);
    setLoading(true);
    setProviders([]);
    setStats(null);

    try {
      const providerResponse = await axios.post(`http://localhost:5001/api/v0/routing/findprovos?arg=${hash}`);
      console.log(providerResponse.data)
      if (providerResponse.data && Array.isArray(providerResponse.data.Responses)) {
        setProviders(providerResponse.data.Responses);
        
        // Fetch stats
        const statsResponse = await axios.post(`http://localhost:5001/api/v0/block/stat?arg=${hash}`);
        setStats(statsResponse.data.Responses[0]);
      } else {
        setProviders([]);
        console.log("No providers found or invalid response format.");
      }

    } catch (error) {
      console.error("Error during API request:", error);
      setProviders([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center m-5">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="QmHash/bafyHash"
          value={hash}
          onChange={handleSearch}
          style={{
            padding: '8px',
            fontSize: '16px',
            width: '800px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <button
          type="submit"
          style={{
            marginLeft: '10px',
            padding: '8px 16px',
            fontSize: '16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#007bff',
            color: 'white',
            cursor: 'pointer'
          }}
          disabled={isButtonDisabled}
          className={`ml-2 px-4 py-2 text-lg rounded-md border-none 
            ${isButtonDisabled ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-500 text-white cursor-pointer'}`}
        >
          Search
        </button>
      </form>
      {loading && !stats ? (
        <div className="loading-indicator">
          <p>Loading...</p>
        </div>
      ) : (
        <ProviderList providers={providers} hash={hash} stats={stats} />
      )}
    </div>
  );
}

function ProviderList({ providers, hash, stats }: { providers: any[], hash: string, stats: any }): JSX.Element {
  return (
    <div>
      {providers.length > 0 ? (
        providers.map((provider) => (
          <ProviderCard key={provider.ID} provider={provider} hash={hash} stats={stats} />
        ))
      ) : (
        <div>No providers found.</div>
      )}
    </div>
  );
}

function ProviderCard({ provider, hash, stats }: { provider: any, hash: string, stats: any }): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const findCircuitAddr = (addresses: string[]): string | undefined => {
    return addresses.find(addr => addr.includes('tcp') && addr.includes('p2p-circuit'));
  };

  const downloadFile = async (providerId: string) => {
    console.log(`Downloading file ${hash} from ${providerId}`);
    setDialogOpen(false);
    setLoading(true);
    setErrorMessage('');

    let filteredAddr = findCircuitAddr(provider.Addrs);
    if (!filteredAddr) {
      for (let addr of provider.Addrs) {
        if (addr.includes('tcp')) {
          const peerArg = `${addr}/p2p/${providerId}`;
          try {
            const response = await axios.post(`http://localhost:5001/api/v0/block/get?arg=${hash}&peer=${peerArg}`, null, {
              responseType: 'blob',
            });
            downloadBlob(response.data, hash);
            break;
          } catch (error) {
            setLoading(false);
            setErrorMessage('Failed to download file.');
          }
        }
      }
    } else {
      const peerArg = `${filteredAddr}/p2p/${providerId}`;
      try {
        const response = await axios.post(`http://localhost:5001/api/v0/block/get?arg=${hash}&peer=${peerArg}`, null, {
          responseType: 'blob',
        });
        downloadBlob(response.data, hash);
      } catch (error) {
        setLoading(false);
        setErrorMessage('Failed to download file.');
      }
    }
  };

  const downloadBlob = (blobData: Blob, fileName: string) => {
    payForFile(); // pay for file then initiate download
    const url = window.URL.createObjectURL(blobData);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoading(false);
  };

  const payForFile = async () => {
    const name = stats.Name;
    const price = stats.Price;
    const destAddress = "1FmKD3porqFbHCcUUSFWETNLd3v56sQY7L" //change this to metadata wallet
    try {
      console.log(`Paying ${price} WACO for ${name}`)
      const cmdres = await window.versions.btcctlcmd(['sendtoaddress', '"' + destAddress + '"', price]);
      console.log(cmdres);
      const ret = await window.versions.killWallet();
      const ret2 = await window.versions.startWallet();
      // relog in
      const passres = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "walletpassphrase", params: [localStorage.getItem("walletpassword"), 99999999]}, {
          auth: {
            username: 'user',
            password: 'password'
          },
          headers: {
            'Content-Type': 'text/plain;',
          },
        });
      console.log(passres);
      console.log("killed wallet after transaction");
    } catch (error) {
      console.error('Payment failed', error);
      setErrorMessage('Payment failed');
    }
  }

  const handleDownload = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    provider.Addrs && provider.Addrs.length > 0 ? (
      <div style={{ position: 'relative', margin: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width:'600px'}}>
        <p className="mb-2"> {stats.Name}</p>
        
        <p style={{ width: '100%' }}>Provider ID: {provider.ID}</p>
         {/* <div>
          <ul>
            {provider.Addrs.map((addr: string, idx: number) => (
              <li key={idx}>{addr}</li>
            ))}
          </ul>
        </div> */}
        <p> Price: {stats.Price} WACO</p>
        <div style={{ width: '100%', marginTop: '10px', textAlign: 'right' }}>
          <LoadingButton
            loading={loading}
            variant="contained"
            color="primary"
            onClick={handleDownload}
          >
            Download
          </LoadingButton>
        </div>
        {errorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>}
        <ConfirmationDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          onConfirm={() => downloadFile(provider.ID)}
          title="Download?"
          message={`Are you sure you want to download this file at a price of ${stats.Price}`}
        />
      </div>
    ) : null
  );
}

export default ExplorePage;
