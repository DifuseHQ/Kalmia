package services

import (
	"bytes"
	"fmt"
	"path/filepath"
	"strings"
	"testing"

	"git.difuse.io/Difuse/kalmia/config"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3iface"
	"github.com/gabriel-vasile/mimetype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockS3Client struct {
	mock.Mock
	s3iface.S3API
}

func (m *MockS3Client) PutObject(input *s3.PutObjectInput) (*s3.PutObjectOutput, error) {
	args := m.Called(input)
	return args.Get(0).(*s3.PutObjectOutput), args.Error(1)
}

func TestUploadToStorage(t *testing.T) {
	// Create a test configuration
	testConfig := &config.Config{
		S3: config.S3{
			Endpoint:        "http://localhost:4566",
			Region:          "us-east-1",
			AccessKeyId:     "test-key",
			SecretAccessKey: "test-secret",
			Bucket:          "test-bucket",
			UsePathStyle:    true,
			PublicUrlFormat: "http://localhost:4566/test-bucket/%s",
		},
	}

	// Create a mock S3 client
	mockS3 := new(MockS3Client)

	// Override the newS3Client function for this test
	originalNewS3Client := newS3Client
	newS3Client = func(sess *session.Session) s3iface.S3API {
		return mockS3
	}

	// Restore the original function after the test
	defer func() {
		newS3Client = originalNewS3Client
	}()

	tests := []struct {
		name             string
		fileContent      string
		originalFilename string
		contentType      string
		expectedExt      string
		mockError        error
	}{
		{
			name:             "Upload PNG",
			fileContent:      "\x89PNG\r\n\x1a\n", // PNG file header
			originalFilename: "test.png",
			contentType:      "image/png",
			expectedExt:      ".png",
			mockError:        nil,
		},
		{
			name:             "Upload without extension",
			fileContent:      "some plain text content",
			originalFilename: "testfile",
			contentType:      "text/plain",
			expectedExt:      ".txt",
			mockError:        nil,
		},
		{
			name:             "Upload unknown type",
			fileContent:      "unknown binary content",
			originalFilename: "unknown",
			contentType:      "application/octet-stream",
			expectedExt:      ".bin",
			mockError:        nil,
		},
		{
			name:             "Upload with error",
			fileContent:      "error content",
			originalFilename: "error.txt",
			contentType:      "text/plain",
			expectedExt:      ".txt",
			mockError:        fmt.Errorf("mock S3 error"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Set up expectations
			mockS3.On("PutObject", mock.AnythingOfType("*s3.PutObjectInput")).Return(&s3.PutObjectOutput{}, tt.mockError)

			file := bytes.NewReader([]byte(tt.fileContent))
			url, err := UploadToS3Storage(file, tt.originalFilename, tt.contentType, testConfig)

			if tt.mockError != nil {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), "error uploading to S3-compatible storage")
			} else {
				assert.NoError(t, err)
				assert.True(t, strings.HasPrefix(url, strings.TrimSuffix(testConfig.S3.PublicUrlFormat, "%s")))

				filename := extractFilenameFromURL(url)
				expectedExt := tt.expectedExt
				if filepath.Ext(tt.originalFilename) == "" {
					detectedMIME := mimetype.Detect([]byte(tt.fileContent))
					expectedExt = detectedMIME.Extension()
				}
				assert.True(t, strings.HasSuffix(filename, expectedExt), "Expected filename %s to end with %s", filename, expectedExt)
				assert.True(t, strings.HasPrefix(filename, "upload-"), "Expected filename %s to start with 'upload-'", filename)
			}

			mockS3.AssertCalled(t, "PutObject", mock.AnythingOfType("*s3.PutObjectInput"))

			// Clear expectations for the next test
			mockS3.ExpectedCalls = nil
		})
	}
}

func extractFilenameFromURL(url string) string {
	return filepath.Base(url)
}
