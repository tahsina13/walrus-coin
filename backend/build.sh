#!/bin/bash

echo "Building btcd..."
cd ./btcd
git submodule update --init --recursive
go build

echo "Building btcctl..."
cd ./cmd/btcctl && go build
./btcctl --configfile='../../../btcctl.conf' addnode "130.245.173.221:8333" add | cat
cd ../../..

echo "Building btcwallet..."
cd ./btcwallet && go build && cd ..

echo "Building server..."
cd ./cmd/server && go build && cd ../..
