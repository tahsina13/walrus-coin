package dht

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/ipfs/boxo/blockstore"
	"github.com/ipfs/boxo/ipld/merkledag"
	"github.com/ipfs/go-cid"
	format "github.com/ipfs/go-ipld-format"
	"github.com/sirupsen/logrus"
)

type DAGNode struct {
	Cid      string     `json:"cid"`
	Name     string     `json:"name"`
	Children []*DAGNode `json:"children"`
}

func createDAGNode(ctx context.Context, bstore blockstore.Blockstore, name string) (format.Node, error) {
	logrus.Debugf("Creating DAG node for '%s'", name)
	info, err := os.Stat(name)
	if err != nil {
		if os.IsNotExist(err) {
			err = fmt.Errorf("file does not exist: %w", err)
		} else {
			err = fmt.Errorf("failed to stat file: %w", err)
		}
		return nil, err
	}

	if !info.IsDir() {
		// TODO: chunk large files
		bytes, err := os.ReadFile(name)
		if err != nil {
			err = fmt.Errorf("failed to read file '%s': %w", name, err)
			return nil, err
		}

		node := merkledag.NewRawNode(bytes)
		if err := bstore.Put(ctx, node); err != nil {
			err = fmt.Errorf("failed to put node: %w", err)
			return nil, err
		}
		return node, nil
	}

	node := merkledag.NodeWithData(nil)
	entries, err := os.ReadDir(name)
	if err != nil {
		err = fmt.Errorf("failed to read directory '%s': %w", name, err)
		return nil, err
	}

	for _, entry := range entries {
		child, err := createDAGNode(ctx, bstore, filepath.Join(name, entry.Name()))
		if err != nil {
			return nil, err
		}

		if err := node.AddNodeLink(entry.Name(), child); err != nil {
			err = fmt.Errorf("failed to add node link '%s': %w", entry.Name(), err)
			return nil, err
		}
	}

	if err := bstore.Put(ctx, node); err != nil {
		err = fmt.Errorf("failed to put node: %w", err)
		return nil, err
	}
	return node, nil
}

func traverseDAGNode(ctx context.Context, nodeGetter format.NodeGetter, c cid.Cid, name string) (*DAGNode, error) {
	node, err := nodeGetter.Get(ctx, c)
	if err != nil {
		return nil, fmt.Errorf("failed to get node: %w", err)
	}

	children := make([]*DAGNode, 0)
	for _, link := range node.Links() {
		child, err := traverseDAGNode(ctx, nodeGetter, link.Cid, link.Name)
		if err != nil {
			return nil, err
		}
		children = append(children, child)
	}
	return &DAGNode{Cid: c.String(), Name: name, Children: children}, nil
}
