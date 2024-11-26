package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"github.com/gabriel-vasile/mimetype"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
	"go.uber.org/zap"
)

func (service *DocService) GitDeploy(docId uint) error {
	doc, err := service.GetDocumentation(docId)
	if err != nil {
		return fmt.Errorf("failed to get documentation: %v", err)
	}

	if doc.GitRepo == "" {
		return nil
	}

	docPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data", "doc_"+fmt.Sprint(docId))
	gitBuildPath := filepath.Join(docPath, "gitbuild")
	gitRemotePath := filepath.Join(docPath, "gitremote")

	if _, err := os.Stat(docPath); os.IsNotExist(err) {
		return fmt.Errorf("documentation path does not exist: %v", err)
	}

	// Build the documentation
	err = utils.RunNpxCommand(docPath, "rspress", "build", "--config", "rspress.config.git.ts")
	if err != nil {
		return fmt.Errorf("failed to run npx command: %v", err)
	}

	if !utils.PathExists(filepath.Join(gitBuildPath, ".nojekyll")) {
		err = utils.TouchFile(filepath.Join(gitBuildPath, ".nojekyll"))
		if err != nil {
			return fmt.Errorf("failed to create .nojekyll file: %v", err)
		}
	}

	// Check if the remote repository exists and if its URL matches the current one
	repo, err := git.PlainOpen(gitRemotePath)
	if err == nil {
		remote, err := repo.Remote("origin")
		if err == nil {
			if remote.Config().URLs[0] != doc.GitRepo {
				// Repository URL has changed, remove the old repository
				os.RemoveAll(gitRemotePath)
				repo = nil
			}
		}
	}

	// If the repository doesn't exist or was removed, clone it
	if repo == nil {
		repo, err = git.PlainClone(gitRemotePath, false, &git.CloneOptions{
			URL: doc.GitRepo,
			Auth: &http.BasicAuth{
				Username: doc.GitUser,
				Password: doc.GitPassword,
			},
		})
		if err != nil {
			return fmt.Errorf("failed to clone repository: %v", err)
		}
	}

	w, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %v", err)
	}

	// Fetch the latest changes
	err = repo.Fetch(&git.FetchOptions{
		Auth: &http.BasicAuth{
			Username: doc.GitUser,
			Password: doc.GitPassword,
		},
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		return fmt.Errorf("failed to fetch from remote: %v", err)
	}

	// Check if the branch exists locally
	branchRef := plumbing.NewBranchReferenceName(doc.GitBranch)
	_, err = repo.Reference(branchRef, true)
	branchExists := err == nil

	// Checkout or create the branch
	if branchExists {
		err = w.Checkout(&git.CheckoutOptions{
			Branch: branchRef,
		})
	} else {
		err = w.Checkout(&git.CheckoutOptions{
			Branch: branchRef,
			Create: true,
		})
	}
	if err != nil {
		return fmt.Errorf("failed to checkout branch %s: %v", doc.GitBranch, err)
	}

	// Reset the branch to match the remote
	remoteRef, err := repo.Reference(plumbing.NewRemoteReferenceName("origin", doc.GitBranch), true)
	if err != nil {
		if err == plumbing.ErrReferenceNotFound {
			// If the remote branch doesn't exist, we'll create it when we push
			remoteRef = plumbing.NewHashReference(branchRef, plumbing.ZeroHash)
		} else {
			return fmt.Errorf("failed to get remote reference: %v", err)
		}
	}

	err = w.Reset(&git.ResetOptions{
		Commit: remoteRef.Hash(),
		Mode:   git.HardReset,
	})
	if err != nil {
		return fmt.Errorf("failed to reset branch to match remote: %v", err)
	}

	// Clean the gitRemotePath
	err = filepath.Walk(gitRemotePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			if os.IsNotExist(err) {
				return nil
			}
			return err
		}
		if info.IsDir() {
			if info.Name() == ".git" {
				return filepath.SkipDir
			}
			return nil
		}
		if path != gitRemotePath {
			err := os.Remove(path)
			if err != nil && !os.IsNotExist(err) {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to clean gitRemotePath: %v", err)
	}

	// Copy new files
	err = filepath.Walk(gitBuildPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(gitBuildPath, path)
		if err != nil {
			return err
		}
		destPath := filepath.Join(gitRemotePath, relPath)
		if info.IsDir() {
			return os.MkdirAll(destPath, info.Mode())
		}
		return utils.CopyFile(path, destPath)
	})
	if err != nil {
		return fmt.Errorf("failed to copy new files: %v", err)
	}

	// Add changes
	_, err = w.Add(".")
	if err != nil {
		return fmt.Errorf("failed to add changes: %v", err)
	}

	// Check if there are changes to commit
	status, err := w.Status()
	if err != nil {
		return fmt.Errorf("failed to get worktree status: %v", err)
	}

	if status.IsClean() {
		logger.Debug("No changes to commit on git", zap.Uint("docId", docId))
		return nil
	}

	// Commit changes
	updateMessage := fmt.Sprintf("Update @ %s", time.Now().Format("2006-01-02 15:04:05"))
	_, err = w.Commit(updateMessage, &git.CommitOptions{
		All: true,
		Author: &object.Signature{
			Name:  doc.GitUser,
			Email: doc.GitEmail,
			When:  time.Now(),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to commit changes: %v", err)
	}

	// Push changes
	err = repo.Push(&git.PushOptions{
		RemoteName: "origin",
		Auth: &http.BasicAuth{
			Username: doc.GitUser,
			Password: doc.GitPassword,
		},
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		return fmt.Errorf("failed to push changes: %v", err)
	}

	return nil
}

func (service *DocService) CloneRepo(url string, cfg *config.Config) (string, error) {
	// Create a temporary directory for cloning
	tempDir, err := os.MkdirTemp("", "repo-clone-")
	if err != nil {
		return "", fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Clone repository
	cloneOptions := &git.CloneOptions{
		URL: url,
	}

	_, err = git.PlainClone(tempDir, false, cloneOptions)
	if err != nil {
		return "", fmt.Errorf("failed to clone repository: %v", err)
	}

	// Parse Markdown files
	doc := make(map[string]interface{})
	err = parseMarkdownFiles(tempDir, doc, cfg)
	if err != nil {
		return "", fmt.Errorf("failed to parse markdown files: %v", err)
	}

	// Convert to JSON with indentation for readability
	jsonBytes, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to convert to JSON: %v", err)
	}

	return string(jsonBytes), nil
}

func parseMarkdownFiles(dir string, doc map[string]interface{}, cfg *config.Config) error {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return err
	}

	for _, file := range files {
		fullPath := filepath.Join(dir, file.Name())

		// Skip hidden files and directories
		if strings.HasPrefix(file.Name(), ".") {
			continue
		}

		// If it's a directory, recurse into it
		if file.IsDir() {
			subGroup := make(map[string]interface{})

			// Recurse into the subdirectory
			err := parseMarkdownFiles(fullPath, subGroup, cfg)
			if err != nil {
				return err
			}

			// Only add non-empty subdirectories
			if len(subGroup) > 0 {
				doc[file.Name()] = subGroup
			}
		} else if strings.HasSuffix(file.Name(), ".md") {
			// If it's a .md file, read its content
			content, err := ioutil.ReadFile(fullPath)
			if err != nil {
				return err
			}
			strContent := string(content)

			// Process media URLs and upload them to S3
			strContent, err = processMediaAndUploadToS3(strContent, dir, cfg)
			if err != nil {
				return err
			}

			doc[file.Name()] = strContent
		}
	}
	return nil
}

var (
	MediaRegex = regexp.MustCompile(`!\[[^\]]*\]\(([^)]+)\)|\[[^\]]*\]\(([^)]+)\)`)
)

func processMediaAndUploadToS3(content, dir string, cfg *config.Config) (string, error) {
	URLSlice := MediaRegex.FindAllStringSubmatch(content, -1)
	for _, Sub := range URLSlice {
		mediaPath := ""
		if Sub[1] != "" {
			mediaPath = Sub[1]
		} else if Sub[2] != "" {
			mediaPath = Sub[2]
		}

		if strings.HasPrefix(mediaPath, "http") {
			continue
		}
		// Decode URL-encoded characters in the media path
		decodedMediaPath, err := url.QueryUnescape(mediaPath)
		if err != nil {
			return content, fmt.Errorf("error decoding media path: %v", err)
		}

		// Resolve the absolute path to the media file
		absPath, err := filepath.Abs(filepath.Join(dir, decodedMediaPath))
		if err != nil {
			return content, fmt.Errorf("error resolving media path: %v", err)
		}
		// Open the file (e.g., image, audio, etc.)
		file, err := os.Open(absPath)
		if err != nil {
			return content, fmt.Errorf("error opening media file: %v", err)
		}
		defer file.Close()

		// Detect MIME type
		mime, _ := mimetype.DetectReader(file)
		_, err = file.Seek(0, 0) // Reset file reader position
		if err != nil {
			log.Fatal(err)
		}

		// Upload the media to S3 and get the S3 URL
		s3URL, err := uploadMediaToS3(file, filepath.Base(mediaPath), mime.String(), cfg)
		if err != nil {
			return content, err
		}

		// Replace the local media path with the public S3 URL in markdown
		content = strings.ReplaceAll(content, mediaPath, s3URL)
	}

	return content, nil
}

func uploadMediaToS3(file *os.File, filename, mimeType string, cfg *config.Config) (string, error) {
	s3URL, err := UploadToStorage(file, filename, mimeType, cfg)
	if err != nil {
		return "", fmt.Errorf("error uploading media to S3: %v", err)
	}

	return s3URL, nil
}
