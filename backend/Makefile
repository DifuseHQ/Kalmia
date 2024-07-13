.PHONY: all deps test build clean build-amd64-linux build-arm64-linux

APP_NAME=kalmia
APP_VERSION=0.0.1
TEST_DIRS := $(shell find . -name '*_test.go' -exec dirname {} \; | sort -u)

all: deps build

deps:
	go mod download

test:
ifeq ($(strip $(TEST_DIRS)),)
	@echo "No test files found."
else
	@for dir in $(TEST_DIRS); do \
		echo "Running tests in $$dir"; \
		go test $$dir; \
	done
endif

build-amd64-linux:
	GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_linux_amd64 main.go

build-arm64-linux:
	GOOS=linux GOARCH=arm64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_linux_arm64 main.go

build-win64:
	GOOS=windows GOARCH=amd64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_win64.exe main.go

build-freebsd64:
	GOOS=freebsd GOARCH=amd64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_freebsd64 main.go

build-macos-arm64:
	GOOS=darwin GOARCH=arm64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_macos64 main.go

build-macos-amd64:
	GOOS=darwin GOARCH=armd64 go build -ldflags "-s -w" -o dist/$(APP_NAME)_$(APP_VERSION)_macos64 main.go


build: clean build-amd64-linux build-arm64-linux build-win64 build-freebsd64
	mkdir -p dist

clean:
	rm -rf dist