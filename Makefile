BACKEND:=backend
BUILD:=build
STATICCHECK:=/Users/ozzy/go/bin/./staticcheck
TEST_NAME:=TestReq

$(shell mkdir -p $(BACKEND)/$(BUILD))

.DEFAULT_GOAL := run-mac
.PHONY: build build-mac build-windows build-linux build-all clean test test-race test-coverage lint run-mac run-linux

build: build-all

build-mac:
	GOOS=darwin GOARCH=arm64 go -C $(BACKEND) build -o $(BUILD)/ordelo-darwin .

build-windows:
	GOOS=windows GOARCH=amd64 go -C $(BACKEND) build -o $(BUILD)/ordelo-windows.exe .

build-linux:
	GOOS=linux GOARCH=amd64 go -C $(BACKEND) build -o $(BUILD)/ordelo-linux .

build-all: build-mac build-windows build-linux

test:
	go clean -testcache
	go -C $(BACKEND) test -v .

test-race:
	go clean -testcache
	go -C $(BACKEND) test -race .

test-coverage:
	go -C $(BACKEND) test -coverprofile=$(BUILD)/coverage.out ./...
	go -C $(BACKEND) tool cover -html=$(BUILD)/coverage.out -o $(BUILD)/coverage.html

test-one:
	go -C $(BACKEND) test -v -run $(TEST_NAME)

lint:
	go -C $(BACKEND) fmt ./...
	go -C $(BACKEND) vet ./...
	cd $(BACKEND) && $(STATICCHECK) ./...

clean:
	rm -rf $(BACKEND)/$(BUILD)

run-mac: build-mac
	./$(BACKEND)/$(BUILD)/./ordelo-darwin

run-win: build-windows
	./$(BACKEND)/$(BUILD)/ordelo-windows.exe

run-linux: build-linux
	./$(BACKEND)/$(BUILD)/./ordelo-linux
