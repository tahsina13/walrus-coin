# Walrus Coin

## How to run

```bash
cd /path/to/repo/backend
git submodule update --init --recursive
./build.sh
cd ../frontend
npm install
npm start
```

if there are problems with node-gyp there is relevant documentation here: https://github.com/nodejs/node-gyp  

Our Boostrap Node:
When you run for the first time, backend/config.yml will be created. Go into the file, and make sure that the boostrapaddr: only has the following  
bootstrapaddr:  
\- "/ip4/104.236.198.140/tcp/61000/p2p/12D3KooWFHfjDXXaYMXUigPCe14cwGaZCzodCWrQGKXUjYraoX3t"
