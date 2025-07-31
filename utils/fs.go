package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"git.difuse.io/Difuse/kalmia/config"
	"golang.org/x/mod/sumdb/dirhash"
)

func PathExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

func CopyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}

	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}

	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return err
	}

	return destFile.Sync()
}

func TouchFile(path string) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}

	_, err = file.WriteString("1")
	if err != nil {
		return err
	}

	return file.Close()
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

func DirHash(dir string) (string, error) {
	hash, err := dirhash.HashDir(dir, dir, dirhash.DefaultHash)
	if err != nil {
		return "", err
	}
	return hash, nil
}

func GetFileExtension(filename string) string {
	tmpStringSlice := strings.Split(filename, ".")

	extension := tmpStringSlice[len(tmpStringSlice)-1]

	return extension
}

func GetDocPathByID(docID uint, cfg *config.Config) string {
	return filepath.Join(cfg.DataPath, "rspress_data", fmt.Sprintf("doc_%d", docID))
}

func IsEmptyDir(path string) (bool, error) {
	f, err := os.Open(path)
	if err != nil {
		return false, err
	}

	defer f.Close()

	_, err = f.Readdirnames(1)

	if err == io.EOF {
		return true, nil
	}

	return false, err
}
