package services

import (
	"bytes"
	"fmt"
	"io"
	"mime"
	"path/filepath"
	"time"

	"git.difuse.io/Difuse/kalmia/config"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

func UploadToStorage(file io.Reader, originalFilename, contentType string) (string, error) {
	sess, err := session.NewSession(&aws.Config{
		Endpoint:         aws.String(config.ParsedConfig.S3.Endpoint),
		Region:           aws.String(config.ParsedConfig.S3.Region),
		Credentials:      credentials.NewStaticCredentials(config.ParsedConfig.S3.AccessKeyId, config.ParsedConfig.S3.SecretAccessKey, ""),
		S3ForcePathStyle: aws.Bool(config.ParsedConfig.S3.UsePathStyle),
	})
	if err != nil {
		return "", fmt.Errorf("error creating AWS session: %v", err)
	}

	svc := s3.New(sess)

	ext := filepath.Ext(originalFilename)
	if ext == "" {
		if exts, _ := mime.ExtensionsByType(contentType); len(exts) > 0 {
			ext = exts[0]
		} else {
			ext = ".bin"
		}
	}

	filename := fmt.Sprintf("upload-%d%s", time.Now().UnixNano(), ext)
	fileBytes, err := io.ReadAll(file)

	if err != nil {
		return "", fmt.Errorf("error reading file: %v", err)
	}

	_, err = svc.PutObject(&s3.PutObjectInput{
		Bucket:        aws.String(config.ParsedConfig.S3.Bucket),
		Key:           aws.String(filename),
		Body:          bytes.NewReader(fileBytes),
		ContentLength: aws.Int64(int64(len(fileBytes))),
		ContentType:   aws.String(contentType),
	})

	if err != nil {
		return "", fmt.Errorf("error uploading to S3-compatible storage: %v", err)
	}

	publicURL := fmt.Sprintf(config.ParsedConfig.S3.PublicUrlFormat, filename)
	return publicURL, nil
}
