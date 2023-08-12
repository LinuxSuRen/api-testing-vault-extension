build:
	go build -o bin/atest-vault-ext .
test:
	go test ./... -cover -v -coverprofile=coverage.out
	go tool cover -func=coverage.out
build-image:
	docker build .
