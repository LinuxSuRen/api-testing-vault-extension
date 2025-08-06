build: build-ui
	go build -o bin/atest-vault-ext .
build-ui:
	cd ui && npm i && npm run build-only
test:
	go test ./... -cover -v -coverprofile=coverage.out
	go tool cover -func=coverage.out
build-image:
	docker build .
