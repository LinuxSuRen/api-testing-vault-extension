FROM golang:1.20 AS builder

LABEL org.opencontainers.image.source=https://github.com/LinuxSuRen/api-testing-vault-extension
LABEL org.opencontainers.image.description="This is a secret extension of api-testing."

ARG VERSION
ARG GOPROXY
WORKDIR /workspace
COPY cmd/ cmd/
COPY pkg/ pkg/
COPY go.mod go.mod
COPY go.sum go.sum
COPY main.go main.go
COPY README.md README.md

RUN GOPROXY=${GOPROXY} go mod download
RUN GOPROXY=${GOPROXY} CGO_ENABLED=0 go build -ldflags "-w -s" -o atest-vault-ext .

FROM alpine:3.12

COPY --from=builder /workspace/atest-vault-ext /usr/local/bin/atest-vault-ext

CMD [ "atest-vault-ext" ]
