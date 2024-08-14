# Kalmia

> [!WARNING]
> This project is still in development and is not ready for production use.


Kalmia is a Go tool with a web interface for managing RsPress documentation. It supports multiple versions, multiple users, and includes a markdown editor for easy edits.

## Requirements

- Go >= 1.22
- Node.js (version v20.15.0 or later)
- npm (usually comes with Node.js)
- PostgreSQL >= 9.5 (If you're not using SQLite)

## Installation

You can download from releases, our website or even clone the repository:

```bash
git clone https://github.com/DifuseHQ/kalmia.git
cd kalmia
```

## Building

Kalmia uses a Makefile to manage build processes. Here are the main commands:

1. Build everything (including dependencies):

```bash
make all
```

2. Install dependencies (including building the web application):

```bash
make deps
```

3. Run tests:

```bash
make test
```

4. Build for specific platforms:

```bash
make build-amd64-linux
make build-arm64-linux
make build-win64
make build-freebsd64
make build-macos-arm64
make build-macos-amd64
```
5. Build for all supported platforms:

```bash
make build
```

6. Clean build artifacts:

```bash
make clean
```

## Usage

After building, you can find the executable in the dist directory. Run it with:

```bash
cd dist && ./kalmia_<version>_<platform>
```
Replace <version> and <platform> with the appropriate values.

Remember there should be a config.json file in the same directory as the executable or you can specify the same with the -config flag.

You can visit the website at http://localhost:2727/admin to start using Kalmia.

## Contributing

We welcome contributions from the community. Please feel free to submit a Pull Request.

## License

AGPL-3.0
