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
