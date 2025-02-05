package utils

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"git.difuse.io/Difuse/kalmia/logger"
	"go.uber.org/zap"
)

func RunNpmCommand(dir string, command string, args ...string) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return fmt.Errorf("directory '%s' does not exist", dir)
	}

	fullCommand := append([]string{command}, args...)
	const maxRetries = 3

	var output []byte
	var err error

	for i := 0; i < maxRetries; i++ {
		cmd := exec.Command("pnpm", fullCommand...)
		cmd.Dir = dir

		output, err = cmd.CombinedOutput()

		if err == nil {
			return nil
		}

		if len(args) > 0 && args[0] == "install" {
			nodeModulesPath := filepath.Join(dir, "node_modules")
			if err := os.RemoveAll(nodeModulesPath); err != nil {
				return fmt.Errorf("failed to remove node_modules: %w", err)
			}
		}

		if len(args) > 1 && args[1] == "build" {
			buildTmpPath := filepath.Join(dir, "build_tmp")
			if err := os.RemoveAll(buildTmpPath); err != nil {
				return fmt.Errorf("failed to remove build_tmp: %w", err)
			}
		}
	}

	return fmt.Errorf("npm command '%s' failed after %d retries with output %s",
		strings.Join(fullCommand, " "),
		maxRetries,
		string(output))
}

func RunNpxCommand(dir string, command string, args ...string) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return fmt.Errorf("directory '%s' does not exist", dir)
	}

	fullCommand := append([]string{command}, args...)
	const maxRetries = 3

	for i := 0; i < maxRetries; i++ {
		cmd := exec.Command("npx", fullCommand...)
		cmd.Dir = dir

		output, err := cmd.CombinedOutput()

		if err == nil {
			return nil
		}

		if command == "rspress" && len(args) > 0 && args[0] == "build" {
			buildTmpPath := filepath.Join(dir, "build_tmp")
			if err := os.RemoveAll(buildTmpPath); err != nil {
				return fmt.Errorf("failed to remove build_tmp: %w", err)
			}
		}

		logger.Warn("npx command failed", zap.String("command", strings.Join(fullCommand, " ")), zap.Error(err), zap.String("output", string(output)))
	}

	return fmt.Errorf("npx command '%s' failed after %d retries", strings.Join(fullCommand, " "), maxRetries)
}

func NpmPing() bool {
	const maxRetries = 3

	for i := 0; i < maxRetries; i++ {
		cmd := exec.Command("npm", "ping")
		output, err := cmd.CombinedOutput()

		if strings.Contains(string(output), "PONG") && err == nil {
			return true
		}
	}

	for i := 0; i < maxRetries; i++ {
		cmd := exec.Command("pnpm", "ping")
		output, err := cmd.CombinedOutput()

		if strings.Contains(string(output), "PONG") && err == nil {
			return true
		}
	}

	return false
}
