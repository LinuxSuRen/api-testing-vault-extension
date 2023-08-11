package cmd

import (
	"fmt"
	"net"

	"github.com/linuxsuren/api-testing-secret-extension/pkg"
	"github.com/linuxsuren/api-testing/pkg/testing/remote"
	"github.com/spf13/cobra"
	"google.golang.org/grpc"
)

func NewRootCmd() (cmd *cobra.Command) {
	opt := &option{}
	cmd = &cobra.Command{
		Use:  "secret-vault",
		RunE: opt.runE,
	}
	flags := cmd.Flags()
	flags.IntVarP(&opt.port, "port", "p", 7073, "The port of gRPC server")
	flags.StringVarP(&opt.vaultToken, "vault-token", "", "", "The token of vault")
	flags.StringVarP(&opt.vaultAddress, "vault-address", "", "http://127.0.0.1:8200", "The address of vault")
	return
}

func (o *option) runE(cmd *cobra.Command, args []string) (err error) {
	var removeServer remote.SecretServiceServer
	if removeServer, err = pkg.NewRemoteServer(o.vaultAddress, o.vaultToken); err != nil {
		return
	}

	var lis net.Listener
	lis, err = net.Listen("tcp", fmt.Sprintf(":%d", o.port))
	if err != nil {
		return
	}

	gRPCServer := grpc.NewServer()
	remote.RegisterSecretServiceServer(gRPCServer, removeServer)
	cmd.Println("Vault secret extension is running at port", o.port)

	go func() {
		<-cmd.Context().Done()
		gRPCServer.Stop()
	}()

	err = gRPCServer.Serve(lis)
	return
}

type option struct {
	port         int
	vaultToken   string
	vaultAddress string
}
