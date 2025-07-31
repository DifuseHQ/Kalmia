package utils

import (
	"os"
	"path/filepath"

	"git.difuse.io/Difuse/kalmia/logger"
)

func CopyPublicAssetsToDocsIfEmpty(docPath string) error {
	publicAssetsDirPath := filepath.Join(docPath, "public")
	innerDocPath := filepath.Join(docPath, "docs")

	innerDocPublicPath := filepath.Join(innerDocPath, "public")
	if !PathExists(innerDocPublicPath) {
		if err := MakeDir(innerDocPublicPath); err != nil {
			logger.Error("error creating public folder in: " + innerDocPublicPath)
			logger.Error(err.Error())
			return err
		}
	}

	isEmptyDir, err := IsEmptyDir(innerDocPublicPath)
	if err != nil {
		return err
	}

	if isEmptyDir {
		err = os.CopyFS(innerDocPublicPath, os.DirFS(publicAssetsDirPath))
		if err != nil {
			return err
		}
	}
	return nil
}

func CopyOrOveriteDir(sourceDir, destDir string) error {
	sourceDirEntry, err := os.ReadDir(sourceDir)
	if err != nil {
		return err
	}
	for _, file := range sourceDirEntry {
		exists, err := IsFileExistsInDir(file.Name(), destDir)
		if err != nil {
			return err
		}

		if exists {
			err = os.RemoveAll(filepath.Join(destDir, file.Name()))
			if err != nil {
				return err
			}
		}
	}

	return os.CopyFS(destDir, os.DirFS(sourceDir))
}

func IsFileExistsInDir(filename string, dirname string) (bool, error) {
	_, err := os.Stat(filepath.Join(dirname, filename))
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}

	return false, err
}
