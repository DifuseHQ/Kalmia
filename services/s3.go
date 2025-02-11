package services

import (
	"bytes"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"git.difuse.io/Difuse/kalmia/config"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3iface"
	"github.com/gabriel-vasile/mimetype"
)

// TODO: update the parameters to accept services.UploadedFileData{}
func UploadToS3Storage(file io.Reader, originalFilename, contentType string, parsedConfig *config.Config) (string, error) {
	sess, err := session.NewSession(&aws.Config{
		Endpoint:         aws.String(parsedConfig.S3.Endpoint),
		Region:           aws.String(parsedConfig.S3.Region),
		Credentials:      credentials.NewStaticCredentials(parsedConfig.S3.AccessKeyId, parsedConfig.S3.SecretAccessKey, ""),
		S3ForcePathStyle: aws.Bool(parsedConfig.S3.UsePathStyle),
	})
	if err != nil {
		return "", fmt.Errorf("error creating AWS session: %v", err)
	}

	svc := newS3Client(sess)

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("error reading file: %v", err)
	}

	ext := filepath.Ext(originalFilename)
	if ext == "" {
		// TODO: update this part to detect mimetype once on UploadFile()
		detectedMIME := mimetype.Detect(fileBytes)
		ext = detectedMIME.Extension()
		if contentType == "" {
			contentType = detectedMIME.String()
		}
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	filename := fmt.Sprintf("upload-%d%s", time.Now().UnixNano(), ext)

	_, err = svc.PutObject(&s3.PutObjectInput{
		Bucket:        aws.String(parsedConfig.S3.Bucket),
		Key:           aws.String(filename),
		Body:          bytes.NewReader(fileBytes),
		ContentLength: aws.Int64(int64(len(fileBytes))),
		ContentType:   aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("error uploading to S3-compatible storage: %v", err)
	}

	publicURL := fmt.Sprintf(parsedConfig.S3.PublicUrlFormat, filename)
	return publicURL, nil
}

var newS3Client = func(sess *session.Session) s3iface.S3API {
	return s3.New(sess)
}
