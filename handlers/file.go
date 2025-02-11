package handlers

import (
	"net/http"
	"os"
	"path"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/services"
	"gorm.io/gorm"
)

func GetFile(service *gorm.DB, w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	q := r.URL.Query()
	fileData := services.UploadedFileData{
		OriginalName:  q.Get("name"),
		DocId:         q.Get("id"),
		PageId:        q.Get("pageId"),
		VersionId:     q.Get("versionId"),
		VersionNumber: q.Get("version"),
	}
	dataPath := config.ParsedConfig.DataPath

	generatedFilePath := generateFilePath(&fileData, dataPath)

	_, err := os.Open(generatedFilePath)
	if err != nil {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "File not found: " + err.Error()})
		return
	}

	http.ServeFile(w, r, generatedFilePath)
}

func generateFilePath(fileData *services.UploadedFileData, dataPath string) string {
	return path.Join(
		dataPath,
		"rspress_data",
		"doc_"+fileData.DocId,
		"assets",
		fileData.OriginalName)
}
