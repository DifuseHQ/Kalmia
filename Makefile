.PHONY: all deps test build clean build-amd64-linux build-arm64-linux build-web

APP_NAME=kalmia
APP_VERSION=0.2.0
TEST_DIRS := $(shell find . -name '*_test.go' -exec dirname {} \; | sort -u)

all: deps build

deps: build-web
	go mod download

build-web:
	cd web && npm install && rm -rf build/ && npm run build

test:
ifeq ($(strip $(TEST_DIRS)),)
	@echo "No test files found."
else
	@for dir in $(TEST_DIRS); do \
		echo "Running tests in $$dir"; \
		go test $$dir; \
	done
endif

# Linux builds
build-linux-amd64:
	GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_linux_amd64 main.go
build-linux-386:
	GOOS=linux GOARCH=386 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_linux_386 main.go
build-linux-arm:
	GOOS=linux GOARCH=arm go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_linux_arm main.go
build-linux-arm64:
	GOOS=linux GOARCH=arm64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_linux_arm64 main.go
build-linux-riscv64:
	GOOS=linux GOARCH=riscv64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_linux_riscv64 main.go

# Windows builds
build-windows-amd64:
	GOOS=windows GOARCH=amd64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_windows_amd64.exe main.go
build-windows-386:
	GOOS=windows GOARCH=386 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_windows_386.exe main.go
build-windows-arm64:
	GOOS=windows GOARCH=arm64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_windows_arm64.exe main.go

# FreeBSD builds
build-freebsd-amd64:
	GOOS=freebsd GOARCH=amd64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_freebsd_amd64 main.go
build-freebsd-arm64:
	GOOS=freebsd GOARCH=arm64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_freebsd_arm64 main.go

# macOS builds
build-macos-amd64:
	GOOS=darwin GOARCH=amd64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_macos_amd64 main.go
build-macos-arm64:
	GOOS=darwin GOARCH=arm64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_macos_arm64 main.go

build: clean build-linux-amd64 build-linux-386 build-linux-arm build-linux-arm64 build-linux-riscv64 build-windows-amd64 build-windows-386 build-windows-arm64 build-freebsd-amd64 build-freebsd-arm64 build-macos-amd64 build-macos-arm64
	mkdir -p dist

clean:
	rm -rf dist

docker-clean:
	sudo rm -rf ./postgres_data ./minio_data
	docker rm kalmia-postgres-1 kalmia-app-1 kalmia-minio-1 kalmia-createbuckets-1 && docker rmi kalmia-app

