import axios from "axios";
import { ChangeEvent, FormEvent, useState } from "react";

const testProviders = ["QmHash1", "QmHash2", "QmHash3", "QmHash4", "QmHash5"]

function ExplorePage(): JSX.Element {
  return (
    <div>
      <SearchBar />
    </div>
  )
}

function SearchBar(): JSX.Element {
  const [hash, setHash] = useState<string>('')

  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    setHash(e.target.value)
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()

    const response = await axios.post('http://localhost:8080/rpc', {
      jsonrpc: '2.0',
      method: 'DhtService.GetProviders',
      params: {
        cid: hash
      },
      id: 2
    })
  }

  return (
    <div className="flex items-center justify-center m-5">
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
    </div>
  );
};

function ProviderList(): JSX.Element {
  return (
    <div>
      {testProviders.map((provider) => (
        <ProviderCard key={provider} provider={provider} />
      ))}
    </div>
  )
}

function ProviderCard({ provider }): JSX.Element {
  return (
    <div>
      <h3>{provider}</h3>
    </div>
  )
}

export default ExplorePage