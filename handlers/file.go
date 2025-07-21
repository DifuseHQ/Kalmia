package handlers

import (
	"bytes"
	"io"
	"net/http"
	"time"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/logger"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func GetFile(service *gorm.DB, w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	vars := mux.Vars(r)
	filename := vars["filename"]

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

	// fileKey := strings.Split(strings.Split(filename, "-")[1], ".")[0]

	result, err := svc.GetObject(&s3.GetObjectInput{
		Bucket: aws.String("uploads"),
		Key:    aws.String(filename),
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

	http.ServeContent(w, r, filename, time.Now(), bytes.NewReader(body))
	logger.Info("Successfully sent object file: " + filename)

	// INFO: use this if the above doesn't work
	// deletectedMime := mimetype.Detect(body)
	// w.Header().Set("Content-Disposition", "attachment; filename="+filename)
	// w.Header().Set("Content-Type", deletectedMime.String())
	// w.WriteHeader(http.StatusOK)
	// w.Write(body)
}
