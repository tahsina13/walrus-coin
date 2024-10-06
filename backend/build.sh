#!/bin/bash

echo "Building btcd..."
cd ./btcd && go build && cd ..

echo "Building btcwallet..."
cd ./btcwallet && go build && cd ..
