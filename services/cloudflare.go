package services

import (
	"bytes"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"time"

	"git.difuse.io/Difuse/kalmia/config"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

func UploadImage(file multipart.File, contentType string) (string, error) {
	// Initialize a session using AWS SDK
	sess, err := session.NewSession(&aws.Config{
		Endpoint:         aws.String(config.ParsedConfig.S3.Endpoint),
		Region:           aws.String(config.ParsedConfig.S3.Region),
		Credentials:      credentials.NewStaticCredentials(config.ParsedConfig.S3.AccessKeyId, config.ParsedConfig.S3.SecretAccessKey, ""),
		S3ForcePathStyle: aws.Bool(config.ParsedConfig.S3.UsePathStyle),
	})
	if err != nil {
		return "", fmt.Errorf("error creating AWS session: %v", err)
	}

	// Create an S3 service client
	svc := s3.New(sess)

	// Infer file extension from content type
	ext := ".bin" // Default extension if we can't infer it
	if exts, _ := mime.ExtensionsByType(contentType); len(exts) > 0 {
		ext = exts[0]
	}

	// Generate a unique filename
	filename := fmt.Sprintf("upload-%d%s", time.Now().UnixNano(), ext)

	// Read the entire file into a byte slice
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("error reading file: %v", err)
	}

	// Upload the file to S3-compatible storage
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

	// Generate the public URL for the uploaded file
	publicURL := fmt.Sprintf(config.ParsedConfig.S3.PublicUrlFormat, filename)

	return publicURL, nil
}
