package services

import (
	"bytes"
	"fmt"
	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/embedded"
	"git.difuse.io/Difuse/kalmia/utils"
	"gorm.io/gorm"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
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

func copyInitFiles(to string) error {
	toCopy := []string{
		"babel.config.js",
		"package.json",
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

func InitDocusaurus(db *gorm.DB, docId uint) error {
	cfg := config.ParsedConfig
	allDocsPath := filepath.Join(cfg.DataPath, "docusaurus_data")
	docsPath := filepath.Join(allDocsPath, "doc_"+strconv.Itoa(int(docId)))

	err := copyInitFiles(docsPath)

	if err != nil {
		return err
	}

	if err := utils.RunNpmCommand(docsPath, "install", "--prefer-offline", "--no-audit", "--progress=false", "--no-fund"); err != nil {
		return err
	}

	return nil
}
