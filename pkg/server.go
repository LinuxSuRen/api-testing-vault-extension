package pkg

import (
	"context"
	"github.com/linuxsuren/api-testing-secret-extension/ui"

	vault "github.com/hashicorp/vault/api"
	"github.com/linuxsuren/api-testing/pkg/server"
	"github.com/linuxsuren/api-testing/pkg/testing/remote"
)

type secretClient struct {
	mountPath  string
	secretPath string
	client     *vault.Client
	remote.UnimplementedSecretServiceServer
	remote.UnimplementedLoaderServer
}

type RemoteServer interface {
	remote.SecretServiceServer
	remote.LoaderServer
}

func NewRemoteServer(address, token string) (server RemoteServer, err error) {
	config := vault.DefaultConfig()
	config.Address = address

	var client *vault.Client
	if client, err = vault.NewClient(config); err == nil {
		// Authenticate
		client.SetToken(token)
		server = &secretClient{
			client:     client,
			mountPath:  "secret",
			secretPath: "mysecret",
		}
	}
	return
}
func (s *secretClient) GetSecret(ctx context.Context, empty *server.Secret) (reply *server.Secret, err error) {
	reply = &server.Secret{}
	var secret *vault.KVSecret
	secret, err = s.client.KVv2(s.mountPath).Get(ctx, s.secretPath)
	if err == nil {
		reply.Value = secret.Data[empty.Name].(string)
	}
	return
}
func (s *secretClient) GetSecrets(ctx context.Context, empty *server.Empty) (reply *server.Secrets, err error) {
	reply = &server.Secrets{}
	var secret *vault.KVSecret
	secret, err = s.client.KVv2(s.mountPath).Get(ctx, s.secretPath)
	if err == nil {
		for k := range secret.Data {
			reply.Data = append(reply.Data, &server.Secret{
				Name: k,
			})
		}
	}
	return
}
func (s *secretClient) UpdateSecret(ctx context.Context, empty *server.Secret) (reply *server.CommonResult, err error) {
	reply, err = s.CreateSecret(ctx, empty)
	return
}
func (s *secretClient) DeleteSecret(ctx context.Context, empty *server.Secret) (reply *server.CommonResult, err error) {
	err = s.client.KVv2(s.mountPath).Delete(ctx, empty.Name)
	return
}
func (s *secretClient) CreateSecret(ctx context.Context, empty *server.Secret) (reply *server.CommonResult, err error) {
	secretData := map[string]interface{}{}

	if secret, findErr := s.client.KVv2(s.mountPath).Get(ctx, s.secretPath); findErr == nil {
		secretData = secret.Data
	}

	secretData[empty.Name] = empty.Value

	reply = &server.CommonResult{}
	_, err = s.client.KVv2(s.mountPath).Put(ctx, s.secretPath, secretData)
	return
}

func (s *secretClient) GetMenus(ctx context.Context, empty *server.Empty) (reply *server.MenuList, err error) {
	reply = &server.MenuList{
		Data: []*server.Menu{
			{
				Name:  "vault",
				Index: "vault",
				Icon:  "document",
			},
		},
	}
	return
}

func (s *secretClient) GetPageOfJS(ctx context.Context, in *server.SimpleName) (reply *server.CommonResult, err error) {
	reply = &server.CommonResult{
		Success: true,
		Message: ui.GetJS(),
	}
	return
}

func (s *secretClient) GetPageOfCSS(ctx context.Context, in *server.SimpleName) (reply *server.CommonResult, err error) {
	reply = &server.CommonResult{
		Success: true,
		Message: ui.GetCSS(),
	}
	return
}
