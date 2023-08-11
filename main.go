package main

import (
	"os"

	"github.com/linuxsuren/api-testing-secret-extension/cmd"
)

func main() {
	cmd := cmd.NewRootCmd()
	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
