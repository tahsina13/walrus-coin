# Backend

## Usage

Run server module in `cmd/server`.

### Arguments

* `p2pport` (`-l`) [int]: The listen port of libp2p node. Default: 4001.
* `rpcport` (`-p`) [int]: The listen port of rpc server. Default: 5001.
* `seed` (`-s`) [string]: Private key for peer id generation. *Optional*.
* `relay-addr` (`-r`) [string]: List of relay nodes to connect to in the form `<multiaddr>/<peerID>`. *Optional*.
* `bootstrap-addr` (`-b`) [string]: List of bootstrap nodes to connect to in the form `<multiaddr>/<peerID>`. *Optional*.
* `debug` (`-D`) [bool]: Print debug statements. Default: false.

### Config File

Config file formats for YML, YAML, JSON and TOML are supported. Default location is `~/.walrus-coin`. Example config file in YML.

```yml
p2pport: 4001
rpcport: 5001
seed: "123456789"
dbpath: "/path/to/leveldb"
debug: true
relayaddr: 
  - "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
bootstrapaddr:
  - "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"
```

Custom config file can also be specified using the `--config-file` option.

### Example

```sh
go run ./cmd/server --p2pport 4001 --rpcport 5001 --seed "123456789" --relay-addr "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN" --bootstrap-addr "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"
```

## RPC API

By default the RPC API listens on port 5001. It is split it several modules.

### Bootstrap

The bootstrap module is used to connect to remote peers.

#### /api/v0/bootstrap/add

##### Arguments

* `arg` [string]: Peer to add to bootstrap list. **Required**.

##### Response

```json
{
  "Peers": [
    {
      "Addrs": [
        "<multiaddr-string>"
      ],
      "ID": "peer-id"
    }
  ]

}
```

#### /api/v0/bootstrap/list

##### Arguments

None.

##### Response

```json
{
  "Peers": [
    {
      "Addrs": [
        "<multiaddr-string>"
      ],
      "ID": "peer-id"
    }
  ]

}
```

#### /api/v0/bootstrap/rm

##### Arguments

* `arg` [string]: Peer to remove from bootstrap list. **Required**. 

##### Response

```json
{
  "Peers": [
    {
      "Addrs": [
        "<multiaddr-string>"
      ],
      "ID": "peer-id"
    }
  ]

}
```

### Routing

The routing module handles DHT lookups and requests.

#### /api/v0/routing/findpeer

##### Arguments
* `arg` [string]: The id of peer to search for. **Required**.

##### Response

```json
{
  "Responses": [
    {
      "Addrs": [
        "<multiaddr-string>"
      ],
      "ID": "peer-id"
    }
  ]
}
```

#### /api/v0/routing/findprovos

##### Arguments

* `arg` [string]: The key to find providers for. **Required**.
* `num-providers` [int]: The number of providers to find. Default: 20. 

##### Response

```json
{
  "Responses": [
    {
      "Addrs": [
        "<multiaddr-string>"
      ],
      "ID": "peer-id"
    }
  ]
}
```

#### /api/v0/routing/provide

##### Arguments

* `arg` [string]: The CID of exisiting block. **Required**.

##### Response

```json
{
  "Responses": null
}
```

### Block

The block module handles uploading of files.

#### /api/v0/block/get

##### Arguments

* `arg` [string]: The CID of existing block. **Required**.
* `peer` [string]: The remote peer. Query self if no peer. *Optional*.

##### Response

On success the contents of the file will be returned as a \`text/plain\`.

#### /api/v0/block/put

None. 

##### Arguments

##### Request Body

Argument `data` is of file type and is sent via multipart-form data.

##### Response

```json
{
  "Key": "<string>",
  "Size": "<int>"
}
```

#### /api/v0/block/rm

##### Arguments

* `arg` [string]: The CID of exisiting block. **Required**.

##### Response

```json
{
  "Key": "<string>"
}
```

#### /api/v0/block/stat

##### Arguments

* `arg` [string]: The CID of existing block. **Required**.
* `peer` [string]: The remote peer. Query self if not peer. *Optional*.

##### Response

```json
{
  "Key": "<string>",
  "Size": "<int>"
}
```

### Proxy

The bootstrap module is used to handle HTTP Proxying.

#### /api/v0/proxy/start
Starts remote proxy
##### Arguments

* `port` [int]: Port to start the remote proxy server on. (Default 8084)
* `price` [int]: Price per byte. **Required**.

##### Response

```json
{
  "Error": "<string>"
}
```

#### /api/v0/proxy/stop
Stops remote proxy
##### Arguments


##### Response

```json
```

#### /api/v0/proxy/connect
Connect to a remote proxy
##### Arguments
* `remoteProxyAddr` [string]: Address of remote proxy. **Required**.
* `port` [int]: Port to start the local proxy on. (Default 8083)


##### Response

```json
```

#### /api/v0/proxy/disconnect
Disconnect from a remote proxy
##### Arguments

##### Response

```json
```

#### /api/v0/proxy/bytes
Returns the amount of bytes that has been sent
##### Arguments

##### Response

```json
{
  "bytes": "<int>"
}
```
