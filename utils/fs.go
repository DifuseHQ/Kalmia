package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
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

func Tree(dir string) (map[string][]byte, error) {
	filesContent := make(map[string][]byte)
	var traverse func(string, string) error
	traverse = func(currentDir, relativePath string) error {
		entries, err := os.ReadDir(currentDir)
		if err != nil {
			return err
		}
		for _, entry := range entries {
			fullPath := filepath.Join(currentDir, entry.Name())
			relativeFullPath := filepath.Join(relativePath, entry.Name())
			if entry.IsDir() {
				err = traverse(fullPath, relativeFullPath)
				if err != nil {
					return err
				}
			} else {
				content, err := os.ReadFile(fullPath)
				if err != nil {
					return err
				}
				filesContent[relativeFullPath] = content
			}
		}
		return nil
	}
	err := traverse(dir, "")
	if err != nil {
		return nil, err
	}
	return filesContent, nil
}
