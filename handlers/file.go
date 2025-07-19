package handlers

import (
	"io"
	"net/http"
	"path"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/services"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gabriel-vasile/mimetype"
	"gorm.io/gorm"
)

func GetFile(service *gorm.DB, w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	urlQuery := r.URL.Query()
	filename := urlQuery.Get("filename")
	if len(filename) == 0 {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "empty filename"})
		return
	}

	sess, err := session.NewSession(&aws.Config{
		Endpoint:         aws.String(config.ParsedConfig.S3.Endpoint),
		Region:           aws.String(config.ParsedConfig.S3.Region),
		Credentials:      credentials.NewStaticCredentials(config.ParsedConfig.S3.AccessKeyId, config.ParsedConfig.S3.SecretAccessKey, ""),
		S3ForcePathStyle: aws.Bool(config.ParsedConfig.S3.UsePathStyle),
	})
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "error creating s3 session: " + err.Error()})
		return
	}

	// create a new s3 client
	svc := s3.New(sess)

	result, err := svc.GetObject(&s3.GetObjectInput{
		Bucket: aws.String("uploads"),
	})
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "error getting object: " + err.Error()})
		return
	}

	defer result.Body.Close()

	body, err := io.ReadAll(result.Body)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "error reading object body: " + err.Error()})
		return
	}

	deletectedMime := mimetype.Detect(body)
	ext := deletectedMime.Extension()
	_ = ext
}

// func GetFile(service *gorm.DB, w http.ResponseWriter, r *http.Request, cfg *config.Config) {
// 	q := r.URL.Query()
//
// 	fileData := services.UploadedFileData{
// 		OriginalName:  q.Get("name"),
// 		DocId:         q.Get("id"),
// 		PageId:        q.Get("pageId"),
// 		VersionId:     q.Get("versionId"),
// 		VersionNumber: q.Get("version"),
// 	}
// 	dataPath := config.ParsedConfig.DataPath
//
// 	generatedFilePath := generateFilePath(&fileData, dataPath)
//
// 	_, err := os.Open(generatedFilePath)
// 	if err != nil {
// 		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "File not found: " + err.Error()})
// 		return
// 	}
//
// 	http.ServeFile(w, r, generatedFilePath)
// }

func generateFilePath(fileData *services.UploadedFileData, dataPath string) string {
	return path.Join(
		dataPath,
		"rspress_data",
		"doc_"+fileData.DocId,
		"assets",
		fileData.OriginalName)
}
