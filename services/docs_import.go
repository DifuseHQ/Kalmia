package services

import (
	"bytes"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/utils"
	"github.com/PuerkitoBio/goquery"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
	figure "github.com/mangoumbrella/goldmark-figure"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
)

func processMarkdown(content, dir string, cfg *config.Config) (string, error) {
	gm := goldmark.New(
		goldmark.WithRendererOptions(html.WithUnsafe()),
		goldmark.WithParserOptions(parser.WithAutoHeadingID()),
		goldmark.WithExtensions(
			figure.Figure,
		),
	)

	var output bytes.Buffer

	err := gm.Convert([]byte(content), &output)
	if err != nil {
		return "", err
	}

	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(output.Bytes()))
	if err != nil {
		return "", fmt.Errorf("failed to parse HTML: %v", err)
	}

	doc.Find("[src]").Each(func(i int, s *goquery.Selection) {
		src, exists := s.Attr("src")
		if exists {
			if strings.HasPrefix(src, "http") {
				return
			}

			decodedSrc, err := url.QueryUnescape(src)
			if err != nil {
				return
			}

			absPath := filepath.Join(dir, decodedSrc)
			file, err := os.Open(absPath)
			if err != nil {
				return
			}
			defer file.Close()

			mime := utils.GetContentType(absPath)

			s3URL, err := UploadToS3Storage(file, filepath.Base(absPath), mime, cfg)
			if err != nil {
				return
			}

			if strings.HasPrefix(mime, "image/") {
				s.SetAttr("src", s3URL)
			} else if strings.HasPrefix(mime, "video/") {
				s.BeforeHtml(fmt.Sprintf(`<video controls src="%s"></video>`, s3URL))
				s.Remove()
			} else if strings.HasPrefix(mime, "audio/") {
				s.BeforeHtml(fmt.Sprintf(`<audio controls src="%s"></audio>`, s3URL))
				s.Remove()
			} else {
				s.SetAttr("src", s3URL)
			}
		}
	})

	var updatedOutput bytes.Buffer

	if err := goquery.Render(&updatedOutput, doc.Selection); err != nil {
		return "", fmt.Errorf("failed to render updated HTML: %v", err)
	}

	return updatedOutput.String(), nil
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
			strContent, err = processMarkdown(strContent, dir, cfg)
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

	for key, value := range doc {
		if htmlContent, ok := value.(string); ok {
			doc[key] = strings.ReplaceAll(htmlContent, "\n", "")
		}
	}

	jsonBytes, err := utils.MarshalWithoutEscape(doc)

	if err != nil {
		return "", fmt.Errorf("failed to convert to JSON: %v", err)
	}

	return string(jsonBytes), nil
}
