import axios from "axios";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import { LoadingButton } from '@mui/lab';
import ConfirmationDialog from "./ConfirmationDialog";


const testProviders = ["QmHash1", "QmHash2", "QmHash3", "QmHash4", "QmHash5"]

function ExplorePage(): JSX.Element {
  return (
    <div>
      <SearchBar />
    </div>
  )
}

function SearchBar(): JSX.Element {
  const [hash, setHash] = useState<string>('');
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

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
    setHash(e.target.value)
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    console.log("Search: " + hash);
    setLoading(true);

    try {
      // 
      const response = await axios.post(`http://localhost:5001/api/v0/routing/findprovos?arg=${hash}`);
      console.log(response.data);
      if (response.data && Array.isArray(response.data.Responses)) {
        setProviders(response.data.Responses);
      } else {
        console.log("No providers found or invalid response format.");
        setProviders([]);
        setLoading(false);
      }

    } catch (error) {
      console.error("Error during API request:", error);
      setProviders([]);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }
  
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
      {loading ? (
        <div className="loading-indicator">
          <p>Loading...</p>
          {/* Circular Progress MUI? */}
        </div>
      ) : (
        <ProviderList providers={providers} hash={hash} />
      )}
    </div>
  );
};

function ProviderList( { providers, hash }: { providers: any[], hash: string }): JSX.Element {
  return (
    <div>
      {providers.length > 0 ? (
        providers.map((provider) => (
          <ProviderCard key={provider} provider={provider} hash={hash} />
        ))
      ) : (
        <div> No providers found. </div>
      )}
    </div>
  )
}

function ProviderCard({ provider, hash }: { provider: any, hash: string }): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const findCircuitAddr = (addresses: string[]): string | undefined => {
    return addresses.find(addr => addr.includes('tcp') && addr.includes('p2p-circuit'));
  }

  const downloadFile = async (providerId: string) => {
    console.log(`Downloading file ${hash} from ${providerId}`);
    setDialogOpen(false);
    setLoading(true);
    setErrorMessage('');

    let filteredAddr = findCircuitAddr(provider.Addrs);
    // If address doesn't have p2p-circuit address, tries all addresses
    if (!filteredAddr) {
      console.log("No p2p-circuit address found, trying other addresses...");
      for (let addr of provider.Addrs) {
        if (addr.includes('tcp')) {
          const peerArg = `${addr}/p2p/${providerId}`;
          try {
            console.log(`trying ${peerArg}`)
            const response = await axios.post(`http://localhost:5001/api/v0/block/get?arg=${hash}&peer=${peerArg}`, null, {
              responseType: 'blob',
            });
            console.log("Obtained File", response.data);
            console.log(response.data instanceof Blob);
            downloadBlob(response.data, hash);
            break;
          } catch (error) {
            console.error(`Error during API request for address ${addr}:`, error);
            setLoading(false);
            setErrorMessage(`Failed to download file. This could be due to the file not being found, or the provider may not have a persistent copy.`);
          } 
        }
      }
    } else {
      const peerArg = `${filteredAddr}/p2p/${providerId}`;
      try {
        const response = await axios.post(`http://localhost:5001/api/v0/block/get?arg=${hash}&peer=${peerArg}`, null, {
          responseType: 'blob',
        });
        console.log("Obtained file", response.data);
        downloadBlob(response.data, hash);

      } catch (error){
        console.error("Error during API request:", error);
        setLoading(false);
        setErrorMessage(`Failed to download file. This could be due to the file not being found, or the provider may not have a persistent copy.`);
      }
    }
  }

  const downloadBlob = (blobData: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blobData);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoading(false);
  };

  const handleDownload = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    provider.Addrs && provider.Addrs.length > 0 ? (
      <div style={{ position: 'relative', margin: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width:'600px'}}>
        <p style={{width: '100%', marginBottom: '10px'}}>Provider ID: {provider.ID}</p>
        {/* <div>
          <ul>
            {provider.Addrs.map((addr: string, idx: number) => (
              <li key={idx}>{addr}</li>
            ))}
          </ul>
        </div> */}
        <p> Price: 0 WACO</p>
        <div style={{ width: '100%', marginTop: '10px', textAlign: 'right'}}>
          <LoadingButton
            loading={loading}
            variant="contained"
            color="primary"
            className="border border-blue-500 bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleDownload}
            loadingPosition="end"
            endIcon={null}
          > 
            Download 
          </LoadingButton>
        </div>
        {errorMessage && <div className="error-message" style={{ color: 'red', marginTop: '10px'}}>{errorMessage}</div>}
          <ConfirmationDialog
            open={dialogOpen}
            onClose={handleDialogClose}
            onConfirm={() => downloadFile(provider.ID)}
            title="Download?"
            message={`Are you sure you want to download this file at a price of ...`}
          />
      </div>
    ) : null
  );
}

export default ExplorePage