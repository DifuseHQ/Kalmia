package utils

import (
	"path/filepath"
	"testing"
)

func TestRunNpmCommand(t *testing.T) {
	tempDir := createTempTestDir(t)

	initCmd := RunNpmCommand(tempDir, "init", "-y")
	if initCmd != nil {
		t.Fatalf("Failed to initialize npm project: %v", initCmd)
	}

	tests := []struct {
		name        string
		dir         string
		command     string
		args        []string
		expectError bool
	}{
		{
			name:        "Successful npm command",
			dir:         tempDir,
			command:     "install",
			args:        []string{"lodash", "--save-dev"},
			expectError: false,
		},
		{
			name:        "Failed npm command",
			dir:         tempDir,
			command:     "install",
			args:        []string{"non-existent-package-12345"},
			expectError: true,
		},
		{
			name:        "Non-existent directory",
			dir:         filepath.Join(tempDir, "non-existent"),
			command:     "install",
			args:        []string{"lodash"},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := RunNpmCommand(tt.dir, tt.command, tt.args...)

			if tt.expectError && err == nil {
				t.Errorf("Expected an error, but got none")
			}
			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

func TestRunNpxCommand(t *testing.T) {
	tempDir := createTempTestDir(t)

	tests := []struct {
		name        string
		dir         string
		command     string
		args        []string
		expectError bool
	}{
		{
			name:        "Successful npx command",
			dir:         tempDir,
			command:     "cowsay",
			args:        []string{"Hello"},
			expectError: false,
		},
		{
			name:        "Failed npx command",
			dir:         tempDir,
			command:     "non-existent-command-12345",
			args:        []string{"arg"},
			expectError: true,
		},
		{
			name:        "Non-existent directory",
			dir:         filepath.Join(tempDir, "non-existent"),
			command:     "cowsay",
			args:        []string{"Hello"},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := RunNpxCommand(tt.dir, tt.command, tt.args...)

			if tt.expectError && err == nil {
				t.Errorf("Expected an error, but got none")
			}
			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

func TestNpmPing(t *testing.T) {
	result := NpmPing()
	t.Logf("NpmPing result: %v", result)
}
