package utils

import (
	"fmt"
	"net/url"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
)

func IsValidGitURL(str string) bool {
	parsedURL, err := url.Parse(str)
	return err == nil && (parsedURL.Scheme == "http" || parsedURL.Scheme == "https")
}

func IsRepoAccessible(url, username, password string) error {
	remote := git.NewRemote(nil, &config.RemoteConfig{
		Name: "origin",
		URLs: []string{url},
	})

	var auth *http.BasicAuth

	if username != "" && password != "" {
		auth = &http.BasicAuth{
			Username: username,
			Password: password,
		}
	}

	_, err := remote.List(&git.ListOptions{
		Auth: auth,
	})

	if err != nil {
		return fmt.Errorf("repository not accessible: %v", err)
	}

	return nil
}
