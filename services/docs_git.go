package services

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
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

	repo, err := git.PlainOpen(gitRemotePath)
	if err != nil {
		if err == git.ErrRepositoryNotExists {
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
		} else {
			return fmt.Errorf("failed to open git repo: %v", err)
		}
	}

	w, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %v", err)
	}

	status, err := w.Status()
	if err != nil {
		return fmt.Errorf("failed to get worktree status: %v", err)
	}

	if !status.IsClean() {
		err = w.Reset(&git.ResetOptions{Mode: git.HardReset})
		if err != nil {
			return fmt.Errorf("failed to reset unstaged changes: %v", err)
		}
	}

	err = repo.Fetch(&git.FetchOptions{
		Auth: &http.BasicAuth{
			Username: doc.GitUser,
			Password: doc.GitPassword,
		},
	})

	if err != nil && err != git.NoErrAlreadyUpToDate {
		return fmt.Errorf("failed to fetch from remote: %v", err)
	}

	branchRef := plumbing.NewBranchReferenceName(doc.GitBranch)
	_, err = repo.Reference(branchRef, true)
	branchExists := err == nil

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

	remoteRef, err := repo.Reference(plumbing.NewRemoteReferenceName("origin", doc.GitBranch), true)

	if err != nil {
		return fmt.Errorf("failed to get remote reference: %v", err)
	}

	err = w.Reset(&git.ResetOptions{
		Commit: remoteRef.Hash(),
		Mode:   git.HardReset,
	})

	if err != nil {
		return fmt.Errorf("failed to reset branch to match remote: %v", err)
	}

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

	_, err = w.Add(".")
	if err != nil {
		return fmt.Errorf("failed to add changes: %v", err)
	}

	status, err = w.Status()

	if err != nil {
		return fmt.Errorf("failed to get worktree status: %v", err)
	}

	if status.IsClean() {
		logger.Debug("No changes to commit on git", zap.Uint("docId", docId))
		return nil
	}

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
