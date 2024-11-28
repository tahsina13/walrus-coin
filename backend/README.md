# Backend

## Config File

Config file formats for YML, YAML, JSON and TOML are supported. Default location is `~/.walrus-coin`. Example config file in YML.

```yml
p2pport: 4001
rpcport: 5001
seed: "123456789"
debug: true
relay-addr: 
  - "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
bootstrap-addr:
  - "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"
```

Custom config file can also be specified using the `--config-file` option.