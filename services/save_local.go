package services

import (
	"fmt"
	"os"
	"path"

	"git.difuse.io/Difuse/kalmia/config"
	"github.com/gabriel-vasile/mimetype"
)

// UploadedFileData Struct for saving assets
type UploadedFileData struct {
	OriginalName  string
	DocId         string
	MimeType      *mimetype.MIME
	PageId        string
	VersionId     string
	VersionNumber string
}

// Saves to local disk in it's corresponding file with it's saved route
// TODO: Make this operation "atomic"
func SaveToLocal(fileBytes []byte, fileData *UploadedFileData) (string, error) {
	assetPath := path.Join(config.ParsedConfig.DataPath, "rspress_data")
	assetPath = path.Join(assetPath, "doc_"+fileData.DocId, "assets")

	err := os.MkdirAll(assetPath, 0755)
	if err != nil {
		fmt.Printf("Error creating asset directory at path %s\n", assetPath)
		return "", err
	}

	newFileName := path.Join(assetPath, generateFileName(fileData))

	newFile, err := os.Create(newFileName)
	if err != nil {
		fmt.Printf("Error creating a new file %s\n", newFileName)
		return "", err
	}

	defer newFile.Close()

	bytesWritten, err := newFile.Write(fileBytes)
	if err != nil {
		fmt.Println("Error writing to the file", newFileName)
	}
	fmt.Println("Bytes written: ", bytesWritten)

	// generate a file to be matched
	return generateFileURL(fileData), nil
}

func generateFileName(fileData *UploadedFileData) string {
	return fmt.Sprintf("%s-%s-%s-%s-%s.%s",
		fileData.OriginalName,
		fileData.DocId,
		fileData.PageId,
		fileData.VersionId,
		fileData.VersionNumber,
		fileData.MimeType.Extension())
}

func generateFileURL(fileData *UploadedFileData) string {
	return fmt.Sprintf(
		"/kal-api/file/get?name=%s&type=%s&id=%s&pageId=%s&versionId=%s&version=%s",
		generateFileName(fileData),
		fileData.MimeType.String(),
		fileData.DocId,
		fileData.PageId,
		fileData.VersionId,
		fileData.VersionNumber)
}
