package main

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
)

func getRoot(w http.ResponseWriter, r *http.Request) {
	hasFirst := r.URL.Query().Has("first")
	first := r.URL.Query().Get("first")
	fmt.Printf("got / request\n")
	io.WriteString(w, "This is my website!\n")
	fmt.Printf("got / request with get param first(%t) = %s", hasFirst, first)
}
func getHello(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("got /hello request\n")
	io.WriteString(w, "Hello, HTTP!\n")
}
// func getFiles(w http.ResponseWriter, r *http.Request){
// }
func genPrivKey(w http.ResponseWriter, r *http.Request){
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	fmt.Println(body)
	// privkey, err := generatePrivateKeyFromSeed(seed)
}
func main() {
	http.HandleFunc("/", getRoot)
	http.HandleFunc("/hello", getHello)
	http.HandleFunc("/generate", genPrivKey)
	err := http.ListenAndServe("localhost:3333", nil)
	if errors.Is(err, http.ErrServerClosed){
		fmt.Printf("server closed\n")
	} else if err != nil{
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}