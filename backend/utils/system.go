package utils

import (
	"fmt"
	"os/exec"
	"strings"
)

func RunNpmCommand(dir string, command string, args ...string) error {
	fullCommand := append([]string{command}, args...)
	cmd := exec.Command("npm", fullCommand...)
	cmd.Dir = dir

	output, err := cmd.CombinedOutput()

	if err != nil {
		return fmt.Errorf("npm command '%s' failed: %w\nOutput: %s", strings.Join(fullCommand, " "), err, string(output))
	}

	return nil
}

func RunNpxCommand(dir string, command string, args ...string) error {
	fullCommand := append([]string{command}, args...)
	cmd := exec.Command("npx", fullCommand...)
	cmd.Dir = dir

	output, err := cmd.CombinedOutput()

	if err != nil {
		return fmt.Errorf("npx command '%s' failed: %w\nOutput: %s", strings.Join(fullCommand, " "), err, string(output))
	}

	return nil
}

func NpmPing() bool {
	cmd := exec.Command("npm", "ping")
	output, err := cmd.CombinedOutput()

	if !strings.Contains(string(output), "PONG") || err != nil {
		return false
	}

	return true
}
