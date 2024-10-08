go mod tidy
go run internal/dht/main.go
cd internal/dht
go test
cd ../..