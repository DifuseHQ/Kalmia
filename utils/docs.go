package utils

import (
	"os"
	"path/filepath"

	"git.difuse.io/Difuse/kalmia/logger"
)

func CopyPublicAssetsToDocs(docPath string) error {
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
