package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"strings"
)

func PathExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

func MakeDir(path string) error {
	return os.MkdirAll(path, 0755)
}

func WriteToFile(filename, content string) error {
	newHash := sha256.Sum256([]byte(content))
	newHashStr := hex.EncodeToString(newHash[:])

	existingContent, err := os.ReadFile(filename)
	if err == nil {
		existingHash := sha256.Sum256(existingContent)
		existingHashStr := hex.EncodeToString(existingHash[:])

		if existingHashStr == newHashStr {
			return nil
		}
	}

	return os.WriteFile(filename, []byte(content), 0644)
}

func RemovePath(path string) error {
	return os.RemoveAll(path)
}

func MovePath(oldPath, newPath string) error {
	return os.Rename(oldPath, newPath)
}

func ReplaceInFile(filename, oldStr, newStr string) error {
	input, err := os.ReadFile(filename)
	if err != nil {
		return err
	}

	output := strings.ReplaceAll(string(input), oldStr, newStr)

	err = os.WriteFile(filename, []byte(output), 0644)
	if err != nil {
		return err
	}

	return nil
}

func ReplaceManyInFile(filePath string, replacements map[string]string) error {
	for oldStr, newStr := range replacements {
		if err := ReplaceInFile(filePath, oldStr, newStr); err != nil {
			return err
		}
	}
	return nil
}
