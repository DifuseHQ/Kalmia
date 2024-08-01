package services

import (
	"fmt"
	"path/filepath"
	"strconv"
	"strings"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/utils"
)

func copyInitFiles(to string) error {
	toCopy := []string{
		"babel.config.js",
		"package.json",
		"src/",
	}

	for _, file := range toCopy {
		if strings.HasSuffix(file, "/") {
			err := utils.CopyEmbeddedFolder(file, filepath.Join(to, file))
			if err != nil {
				return fmt.Errorf("failed to copy folder %s: %w", file, err)
			}
		} else {
			err := utils.CopyEmbeddedFile(file, filepath.Join(to, file))
			if err != nil {
				return fmt.Errorf("failed to copy file %s: %w", file, err)
			}
		}
	}

	return nil
}

func (service *DocService) InitDocusaurus(docId uint) error {
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
