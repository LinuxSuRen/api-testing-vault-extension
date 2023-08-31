[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a5795d4f9d5545f29da38a1f2266bbdc)](https://app.codacy.com/gh/LinuxSuRen/api-testing-vault-extension?utm_source=github.com&utm_medium=referral&utm_content=LinuxSuRen/api-testing-vault-extension&utm_campaign=Badge_Grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/a5795d4f9d5545f29da38a1f2266bbdc)](https://www.codacy.com/gh/LinuxSuRen/api-testing-vault-extension/dashboard?utm_source=github.com\&utm_medium=referral\&utm_content=LinuxSuRen/api-testing-vault-extension\&utm_campaign=Badge_Coverage)

This is a secret extension of [api-testing](https://github.com/LinuxSuRen/api-testing).

## Start a Vault for dev

```shell
vault server -dev
```

## Run vault server on the local machine

Create a config file for it:

```hcl
ui = true
cluster_addr  = "http://127.0.0.1:8201"
api_addr      = "http://127.0.0.1:8200"

storage "file" {
  path = "/opt/vault/data"
}

listener "tcp" {
  address = "127.0.0.1:8200"
  tls_disable = "true"
}
```

Start the server via: `vault server -config=config.hcl`

then, init it: `vault operator init -address=http://127.0.0.1:8200`
