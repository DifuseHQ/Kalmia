package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
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

func CopyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open source file: %w", err)
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %w", err)
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return fmt.Errorf("failed to copy file contents: %w", err)
	}

	return nil
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

func FileHash(input interface{}) (string, error) {
	var reader io.Reader

	switch v := input.(type) {
	case string:
		file, err := os.Open(v)
		if err != nil {
			return "", err
		}
		defer file.Close()
		reader = file
	case io.Reader:
		reader = v
	default:
		return "", fmt.Errorf("unsupported input type for FileHash")
	}

	hash := sha256.New()
	if _, err := io.Copy(hash, reader); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}
