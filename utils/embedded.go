package utils

import (
	"bytes"
	"io"
	"os"
	"path/filepath"

	"git.difuse.io/Difuse/kalmia/embedded"
)

func ReadEmbeddedFile(path string) ([]byte, error) {
	content, err := embedded.DocusaurusFS.ReadFile("docusaurus/" + path)
	if err != nil {
		return nil, err
	}

	return content, nil
}

func CopyEmbeddedFile(path string, to string) error {
	content, err := embedded.DocusaurusFS.ReadFile("docusaurus/" + path)
	if err != nil {
		return err
	}

	dir := filepath.Dir(to)
	if err = os.MkdirAll(dir, 0755); err != nil {
		return err
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
	dir := filepath.Join("docusaurus", path)
	entries, err := embedded.DocusaurusFS.ReadDir(dir)
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
