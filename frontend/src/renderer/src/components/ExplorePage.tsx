import axios from "axios";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // // Bootstrap
  // useEffect(() => {
  //   const addBootstrap = async () => {
  //     try {
  //       const response = await axios.post("http://localhost:5001/api/v0/bootstrap/add?arg=/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE");
  //       console.log("Bootstrap peer added:", response.data);
  //     } catch (error) {
  //       console.error("Error adding bootstrap:", error);
  //     }
  //   };
  //   addBootstrap();
  // }, []);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    setHash(e.target.value)
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    console.log("Search: " + hash);
    setIsLoading(true);

    try {
      // 
      const response = await axios.post(`http://localhost:5001/api/v0/routing/findprovos?arg=${hash}`);
      console.log(response.data);
      if (response.data && Array.isArray(response.data.Responses)) {
        setProviders(response.data.Responses);
      } else {
        console.log("No providers found or invalid response format.");
        setProviders([]);
      }

    } catch (error) {
      console.error("Error during API request:", error);
      setProviders([]);
    } finally {
      setIsLoading(false);
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
        >
          Search
        </button>
      </form>
      {isLoading ? (
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
  const findCircuitAddr = (addresses: string[]): string | undefined => {
    return addresses.find(addr => addr.includes('tcp') && addr.includes('p2p-circuit'));
  }

  const downloadFile = async (providerId: string) => {
    console.log(`Downloading file ${hash} from ${providerId}`);

    let filteredAddr = findCircuitAddr(provider.Addrs);
    if (!filteredAddr) {
      console.log("No p2p-circuit address found, trying other addresses...");
      for (let addr of provider.Addrs) {
        if (addr.includes('tcp')) {
          const peerArg = `${addr}/p2p/${providerId}`;
          try {
            console.log(`trying ${peerArg}`)
            const response = await axios.post(`http://localhost:5001/api/v0/block/get?arg=${hash}&peer=${peerArg}`, {
              responseType: 'blob',
            });
            console.log("Obtained File", response.data);
            downloadBlob(response.data, hash);
            break;
          } catch (error) {
            console.error(`Error during API request for address ${addr}:`, error);
          }
        }
      }
    } else {
      const peerArg = `${filteredAddr}/p2p/${providerId}`;

      try {
        // 
        const response = await axios.post(`http://localhost:5001/api/v0/block/get?arg=${hash}&peer=${peerArg}`, {
          responseType: 'blob',
        });
        console.log("Obtained file", response.data);
        downloadBlob(response.data, hash);

      } catch (error){
        console.error("Error during API request:", error);
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
  };

  return (
    provider.Addrs && provider.Addrs.length > 0 ? (
      <div style={{ position: 'relative', margin: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        <p style={{width: '100%', marginBottom: '10px'}}>Provider ID: {provider.ID}</p>
        {/* <div>
          <ul>
            {provider.Addrs.map((addr: string, idx: number) => (
              <li key={idx}>{addr}</li>
            ))}
          </ul>
        </div> */}
        <div style={{ width: '100%', marginTop: '10px', textAlign: 'right'}}>
            <button 
              className="border border-blue-500 bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => downloadFile(provider.ID)}
            > 
              Download 
            </button>
          </div>
      </div>
    ) : null
  );
}

export default ExplorePage