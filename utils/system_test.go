package utils

import (
	"os"
	"os/exec"
	"testing"
)

func TestRunNpmCommand(t *testing.T) {
	_, err := exec.LookPath("npm")
	if err != nil {
		t.Skip("npm is not installed, skipping test")
	}

	tempDir, err := os.MkdirTemp("", "npm-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	err = RunNpmCommand(tempDir, "version")
	if err != nil {
		t.Errorf("RunNpmCommand failed: %v", err)
	}

	err = RunNpmCommand(tempDir, "invalid-command")
	if err == nil {
		t.Error("RunNpmCommand should have failed with invalid command")
	}
}

func TestRunNpxCommand(t *testing.T) {
	_, err := exec.LookPath("npx")
	if err != nil {
		t.Skip("npx is not installed, skipping test")
	}

	tempDir, err := os.MkdirTemp("", "npx-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	err = RunNpxCommand(tempDir, "cowsay", "Hello")
	if err != nil {
		t.Errorf("RunNpxCommand failed: %v", err)
	}

	err = RunNpxCommand(tempDir, "invalid-command")
	if err == nil {
		t.Error("RunNpxCommand should have failed with invalid command")
	}
}

func TestNpmPing(t *testing.T) {
	npmPath, err := exec.LookPath("npm")
	if err != nil {
		t.Skip("npm is not installed, skipping test")
	}

	if !NpmPing() {
		t.Error("NpmPing should return true when npm is available")
	}

	backupPath := npmPath + ".backup"
	err = os.Rename(npmPath, backupPath)
	if err != nil {
		t.Fatalf("Failed to rename npm: %v", err)
	}
	defer func() {
		err := os.Rename(backupPath, npmPath)
		if err != nil {
			t.Fatalf("Failed to restore npm: %v", err)
		}
	}()

	if NpmPing() {
		t.Error("NpmPing should return false when npm is not available")
	}
}
