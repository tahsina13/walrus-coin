#!/bin/bash

echo "Building btcd..."
cd ./btcd
git submodule update --init --recursive
go build && cd ..

echo "Building btcwallet..."
cd ./btcwallet && go build && cd ..
