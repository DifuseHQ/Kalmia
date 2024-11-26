package utils

import "testing"

func TestIsValidGitURL(t *testing.T) {
	tests := []struct {
		url     string
		isValid bool
	}{
		{"http://github.com/user/repo.git", true},
		{"https://github.com/user/repo.git", true},
		{"ftp://github.com/user/repo.git", false},
		{"file:///path/to/repo", false},
		{"invalid_url", false},
	}

	for _, test := range tests {
		result := IsValidGitURL(test.url)
		if result != test.isValid {
			t.Errorf("IsValidGitURL(%q) = %v; want %v", test.url, result, test.isValid)
		}
	}
}

func TestIsRepoAccessible(t *testing.T) {
	tests := []struct {
		url      string
		username string
		password string
		wantErr  bool
	}{
		{"https://git.difuse.io/Difuse/at-sender.git", "", "", false},
		{"https://github.com/user/repo.git", "invalid-username", "invalid-password", true},
	}

	for _, test := range tests {
		err := IsRepoAccessible(test.url, test.username, test.password)
		if (err != nil) != test.wantErr {
			t.Errorf("IsRepoAccessible(%q, %q, %q) = %v; want error: %v", test.url, test.username, test.password, err, test.wantErr)
		}
	}
}
