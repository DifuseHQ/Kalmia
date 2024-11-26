package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/utils"
	"github.com/gabriel-vasile/mimetype"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
)

var MediaRegex = regexp.MustCompile(`!\[[^\]]*\]\(([^)]+)\)|\[[^\]]*\]\(([^)]+\.(?:jpg|jpeg|png|gif|mp4|mov|avi|mkv|webm|mp3|wav|ogg|flac|svg|webp))\)`)

func processMdAsset(content, dir string, cfg *config.Config) (string, error) {
	URLSlice := MediaRegex.FindAllStringSubmatch(content, -1)
	for _, sub := range URLSlice {
		mediaPath := ""

		if sub[1] != "" {
			mediaPath = sub[1]
		} else if sub[2] != "" {
			mediaPath = sub[2]
		}

		if strings.HasPrefix(mediaPath, "http") {
			continue
		}

		decodedMediaPath, err := url.QueryUnescape(mediaPath)
		if err != nil {
			return content, fmt.Errorf("error decoding media path: %v", err)
		}

		absPath, err := filepath.Abs(filepath.Join(dir, decodedMediaPath))
		if err != nil {
			return content, fmt.Errorf("error resolving media path: %v", err)
		}

		file, err := os.Open(absPath)
		if err != nil {
			return content, fmt.Errorf("error opening media file: %v", err)
		}
		defer file.Close()

		mime, _ := mimetype.DetectReader(file)
		_, err = file.Seek(0, 0)
		if err != nil {
			log.Fatal(err)
		}

		s3URL, err := UploadToStorage(file, filepath.Base(mediaPath), mime.String(), cfg)

		if err != nil {
			return content, err
		}

		content = strings.ReplaceAll(content, mediaPath, s3URL)
	}

	return content, nil
}

func parseMarkdownFiles(dir string, doc map[string]interface{}, cfg *config.Config) error {
	files, err := os.ReadDir(dir)
	if err != nil {
		return err
	}

	for _, file := range files {
		fullPath := filepath.Join(dir, file.Name())

		if strings.HasPrefix(file.Name(), ".") {
			continue
		}

		if file.IsDir() {
			subGroup := make(map[string]interface{})

			err := parseMarkdownFiles(fullPath, subGroup, cfg)
			if err != nil {
				return err
			}

			if len(subGroup) > 0 {
				doc[file.Name()] = subGroup
			}
		} else if strings.HasSuffix(file.Name(), ".md") {
			content, err := os.ReadFile(fullPath)
			if err != nil {
				return err
			}

			strContent := string(content)
			strContent, err = processMdAsset(strContent, dir, cfg)
			if err != nil {
				return err
			}

			doc[file.Name()] = strContent
		}
	}
	return nil
}

func (service *DocService) ImportGitbook(url, username, password string, cfg *config.Config) (string, error) {
	if !utils.IsValidGitURL(url) {
		return "", fmt.Errorf("invalid_git_url")
	}

	err := utils.IsRepoAccessible(url, username, password)

	if err != nil {
		return "", fmt.Errorf("failed_to_check_repo_access")
	}

	tempDir, err := os.MkdirTemp("", "gitbook-import-")

	if err != nil {
		return "", fmt.Errorf("failed_to_create_temp_dir")
	}

	defer os.RemoveAll(tempDir)

	cloneOptions := &git.CloneOptions{
		URL: url,
	}

	if username != "" && password != "" {
		cloneOptions.Auth = &http.BasicAuth{
			Username: username,
			Password: password,
		}
	}

	_, err = git.PlainClone(tempDir, false, cloneOptions)

	if err != nil {
		return "", fmt.Errorf("failed_to_clone_repo")
	}

	doc := make(map[string]interface{})
	err = parseMarkdownFiles(tempDir, doc, cfg)

	if err != nil {
		return "", fmt.Errorf("failed to parse markdown files: %v", err)
	}

	jsonBytes, err := json.Marshal(doc)
	if err != nil {
		return "", fmt.Errorf("failed to convert to JSON: %v", err)
	}

	return string(jsonBytes), nil
}
