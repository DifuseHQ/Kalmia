package embedded

import (
	"bytes"
	"embed"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"git.difuse.io/Difuse/kalmia/utils"
)

//go:embed rspress
var RspressFS embed.FS

func ReadEmbeddedFile(path string) ([]byte, error) {
	content, err := RspressFS.ReadFile("rspress/" + path)
	if err != nil {
		return nil, err
	}
	return content, nil
}

func CopyEmbeddedFile(path string, to string) error {
	content, err := RspressFS.ReadFile("rspress/" + path)
	if err != nil {
		return err
	}

	dir := filepath.Dir(to)
	if err = os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	embeddedHash, err := utils.FileHash(bytes.NewReader(content))
	destHash, err := utils.FileHash(to)

	if err == nil && destHash == embeddedHash {
		return nil
	}

	destFile, err := os.Create(to)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, bytes.NewReader(content))
	return err
}

func CopyEmbeddedFolder(path string, to string) error {
	dir := filepath.Join("rspress", path)
	entries, err := RspressFS.ReadDir(dir)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		destPath := filepath.Join(to, entry.Name())
		if entry.IsDir() {
			if err := os.MkdirAll(destPath, 0755); err != nil {
				return err
			}
			if err := CopyEmbeddedFolder(filepath.Join(path, entry.Name()), destPath); err != nil {
				return err
			}
		} else {
			if err := CopyEmbeddedFile(filepath.Join(path, entry.Name()), destPath); err != nil {
				return err
			}
		}
	}
	return nil
}

func CopyInitFiles(to string) error {
	toCopy := []string{
		"package.json",
		"postcss.config.js",
		"rspress.config.ts",
		"tsconfig.json",
		"tailwind.config.js",
		"styles/",
		"src/",
	}

	for _, file := range toCopy {
		if strings.HasSuffix(file, "/") {
			err := CopyEmbeddedFolder(file, filepath.Join(to, file))
			if err != nil {
				return fmt.Errorf("failed to copy folder %s: %w", file, err)
			}
		} else {
			err := CopyEmbeddedFile(file, filepath.Join(to, file))
			if err != nil {
				return fmt.Errorf("failed to copy file %s: %w", file, err)
			}
		}
	}
	return nil
}
