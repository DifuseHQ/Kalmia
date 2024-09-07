package utils

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestPathExists(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "testfile")
	if err != nil {
		t.Fatalf("Failed to create temporary file: %v", err)
	}
	defer os.Remove(tmpFile.Name())

	tests := []struct {
		path   string
		exists bool
	}{
		{tmpFile.Name(), true},
		{"nonexistentfile.txt", false},
	}

	for _, test := range tests {
		result := PathExists(test.path)
		if result != test.exists {
			t.Errorf("PathExists(%q) = %v; expected %v", test.path, result, test.exists)
		}
	}
}

func TestCopyFile(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "copyfile_test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	srcPath := filepath.Join(tempDir, "source.txt")
	content := []byte("Hello, World!")
	err = os.WriteFile(srcPath, content, 0644)
	if err != nil {
		t.Fatalf("Failed to create source file: %v", err)
	}

	dstPath := filepath.Join(tempDir, "destination.txt")

	err = CopyFile(srcPath, dstPath)
	if err != nil {
		t.Fatalf("CopyFile failed: %v", err)
	}

	if _, err := os.Stat(dstPath); os.IsNotExist(err) {
		t.Fatal("Destination file was not created")
	}

	copiedContent, err := os.ReadFile(dstPath)
	if err != nil {
		t.Fatalf("Failed to read destination file: %v", err)
	}

	if string(copiedContent) != string(content) {
		t.Fatalf("Copied content does not match source content. Got %s, want %s", string(copiedContent), string(content))
	}
}

func TestTouchFile(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "touchfile_test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	testFilePath := filepath.Join(tempDir, "testfile.txt")

	err = TouchFile(testFilePath)
	if err != nil {
		t.Fatalf("TouchFile failed: %v", err)
	}

	if _, err := os.Stat(testFilePath); os.IsNotExist(err) {
		t.Fatal("Test file was not created")
	}

	content, err := os.ReadFile(testFilePath)
	if err != nil {
		t.Fatalf("Failed to read test file: %v", err)
	}

	if string(content) != "1" {
		t.Fatalf("File content is incorrect. Got %s, want 1", string(content))
	}

	fileInfo, err := os.Stat(testFilePath)
	if err != nil {
		t.Fatalf("Failed to get file info: %v", err)
	}

	expectedPerm := os.FileMode(0644)
	if fileInfo.Mode().Perm() != expectedPerm {
		t.Fatalf("File permissions are incorrect. Got %v, want %v", fileInfo.Mode().Perm(), expectedPerm)
	}
}

func TestMakeDir(t *testing.T) {
	testDir := "./testdir/subdir"

	defer func() {
		if err := os.RemoveAll("./testdir"); err != nil {
			t.Fatalf("Failed to clean up test directory: %v", err)
		}
	}()

	err := MakeDir(testDir)
	if err != nil {
		t.Errorf("MakeDir(%q) returned an error: %v", testDir, err)
		return
	}

	if _, err := os.Stat(testDir); os.IsNotExist(err) {
		t.Errorf("Directory %q was not created", testDir)
	}
}

func TestWriteToFile(t *testing.T) {
	testFile := "./testfile.txt"
	defer func() {
		if err := os.Remove(testFile); err != nil {
			t.Fatalf("Failed to clean up test file: %v", err)
		}
	}()

	tests := []struct {
		content   string
		expectErr bool
	}{
		{"Hello, world!", false},
		{"Hello, world!", false},
		{"New content!", false},
		{"", false},
	}

	for _, test := range tests {
		if err := os.WriteFile(testFile, []byte("Initial content"), 0644); err != nil {
			t.Fatalf("Failed to set up initial file content: %v", err)
		}
		err := WriteToFile(testFile, test.content)
		if (err != nil) != test.expectErr {
			t.Errorf("WriteToFile(%q) returned error: %v; expected error: %v", test.content, err, test.expectErr)
			continue
		}

		if err == nil {
			data, err := os.ReadFile(testFile)
			if err != nil {
				t.Errorf("Failed to read file content: %v", err)
				continue
			}

			if string(data) != test.content {
				t.Errorf("File content = %q; expected %q", string(data), test.content)
			}
		}
	}
}

func TestRemovePath(t *testing.T) {
	testDir := "./testdir"
	testFile := "./testdir/testfile.txt"
	if err := os.MkdirAll(testDir, 0755); err != nil {
		t.Fatalf("Failed to create test directory: %v", err)
	}
	if err := os.WriteFile(testFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}
	if _, err := os.Stat(testFile); os.IsNotExist(err) {
		t.Fatalf("Test file does not exist before RemovePath")
	}
	if _, err := os.Stat(testDir); os.IsNotExist(err) {
		t.Fatalf("Test directory does not exist before RemovePath")
	}
	err := RemovePath(testDir)
	if err != nil {
		t.Errorf("RemovePath(%q) returned an error: %v", testDir, err)
		return
	}
	if _, err := os.Stat(testFile); !os.IsNotExist(err) {
		t.Errorf("Test file still exists after RemovePath")
	}
	if _, err := os.Stat(testDir); !os.IsNotExist(err) {
		t.Errorf("Test directory still exists after RemovePath")
	}
}

func TestMovePath(t *testing.T) {
	oldDir := "./oldpath"
	oldPath := oldDir + "/testfile.txt"
	newDir := "./newpath"
	newPath := newDir + "/testfile.txt"

	if err := os.MkdirAll(oldDir, 0755); err != nil {
		t.Fatalf("Failed to create oldpath directory: %v", err)
	}
	if err := os.WriteFile(oldPath, []byte("test content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	if _, err := os.Stat(oldPath); os.IsNotExist(err) {
		t.Fatalf("Test file does not exist at old path before MovePath")
	}

	if err := os.MkdirAll(newDir, 0755); err != nil {
		t.Fatalf("Failed to create newpath directory: %v", err)
	}

	err := MovePath(oldPath, newPath)
	if err != nil {
		t.Errorf("MovePath(%q, %q) returned an error: %v", oldPath, newPath, err)
		return
	}

	if _, err := os.Stat(newPath); os.IsNotExist(err) {
		t.Errorf("Test file does not exist at new path after MovePath")
	}
	if _, err := os.Stat(oldPath); !os.IsNotExist(err) {
		t.Errorf("Test file still exists at old path after MovePath")
	}

	if err := os.Remove(newPath); err != nil {
		t.Errorf("Failed to clean up test file at new path: %v", err)
	}
	if err := os.RemoveAll(newDir); err != nil {
		t.Errorf("Failed to clean up newpath directory: %v", err)
	}
	if err := os.RemoveAll(oldDir); err != nil {
		t.Errorf("Failed to clean up oldpath directory: %v", err)
	}
}

func TestReplaceInFile(t *testing.T) {
	filePath := "./testfile.txt"
	initialContent := "Hello, world! Hello again!"
	if err := os.WriteFile(filePath, []byte(initialContent), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}
	oldStr := "Hello"
	newStr := "Hi"
	err := ReplaceInFile(filePath, oldStr, newStr)
	if err != nil {
		t.Errorf("ReplaceInFile(%q, %q, %q) returned an error: %v", filePath, oldStr, newStr, err)
		return
	}
	expectedContent := "Hi, world! Hi again!"
	data, err := os.ReadFile(filePath)
	if err != nil {
		t.Errorf("Failed to read file content: %v", err)
		return
	}

	if string(data) != expectedContent {
		t.Errorf("File content = %q; expected %q", string(data), expectedContent)
	}
	if err := os.Remove(filePath); err != nil {
		t.Errorf("Failed to clean up test file: %v", err)
	}
}

func TestReplaceManyInFile(t *testing.T) {
	filePath := "./testfile.txt"
	initialContent := "Hello, world! Goodbye, world!"
	if err := os.WriteFile(filePath, []byte(initialContent), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}
	replacements := map[string]string{
		"Hello":   "Hi",
		"Goodbye": "Farewell",
	}
	err := ReplaceManyInFile(filePath, replacements)
	if err != nil {
		t.Errorf("ReplaceManyInFile(%q, %v) returned an error: %v", filePath, replacements, err)
		return
	}
	expectedContent := "Hi, world! Farewell, world!"
	data, err := os.ReadFile(filePath)
	if err != nil {
		t.Errorf("Failed to read file content: %v", err)
		return
	}

	if string(data) != expectedContent {
		t.Errorf("File content = %q; expected %q", string(data), expectedContent)
	}
	if err := os.Remove(filePath); err != nil {
		t.Errorf("Failed to clean up test file: %v", err)
	}
}

func TestFileHash(t *testing.T) {
	t.Run("File path input", func(t *testing.T) {
		tempDir := t.TempDir()
		tempFile := filepath.Join(tempDir, "test.txt")
		content := []byte("Hello, World!")
		err := os.WriteFile(tempFile, content, 0644)
		if err != nil {
			t.Fatalf("Failed to create temp file: %v", err)
		}

		expectedHash := sha256.Sum256(content)
		expectedHashString := hex.EncodeToString(expectedHash[:])

		hash, err := FileHash(tempFile)
		if err != nil {
			t.Fatalf("FileHash failed: %v", err)
		}

		if hash != expectedHashString {
			t.Errorf("Hash mismatch. Expected: %s, Got: %s", expectedHashString, hash)
		}
	})

	t.Run("io.Reader input", func(t *testing.T) {
		content := []byte("Hello, World!")
		reader := bytes.NewReader(content)

		expectedHash := sha256.Sum256(content)
		expectedHashString := hex.EncodeToString(expectedHash[:])

		hash, err := FileHash(reader)
		if err != nil {
			t.Fatalf("FileHash failed: %v", err)
		}

		if hash != expectedHashString {
			t.Errorf("Hash mismatch. Expected: %s, Got: %s", expectedHashString, hash)
		}
	})

	t.Run("Unsupported input type", func(t *testing.T) {
		_, err := FileHash(123)
		if err == nil {
			t.Error("Expected an error for unsupported input type, but got nil")
		}
		if err.Error() != "unsupported input type for FileHash" {
			t.Errorf("Unexpected error message. Expected 'unsupported input type for FileHash', got '%v'", err)
		}
	})

	t.Run("Non-existent file", func(t *testing.T) {
		_, err := FileHash("/path/to/non/existent/file")
		if err == nil {
			t.Error("Expected an error for non-existent file, but got nil")
		}
	})

	t.Run("Empty file", func(t *testing.T) {
		tempDir := t.TempDir()
		tempFile := filepath.Join(tempDir, "empty.txt")
		err := os.WriteFile(tempFile, []byte{}, 0644)
		if err != nil {
			t.Fatalf("Failed to create empty temp file: %v", err)
		}

		hash, err := FileHash(tempFile)
		if err != nil {
			t.Fatalf("FileHash failed for empty file: %v", err)
		}

		expectedHash := sha256.Sum256([]byte{})
		expectedHashString := hex.EncodeToString(expectedHash[:])

		if hash != expectedHashString {
			t.Errorf("Hash mismatch for empty file. Expected: %s, Got: %s", expectedHashString, hash)
		}
	})

	t.Run("Large file", func(t *testing.T) {
		tempDir := t.TempDir()
		tempFile := filepath.Join(tempDir, "large.txt")
		f, err := os.Create(tempFile)
		if err != nil {
			t.Fatalf("Failed to create large temp file: %v", err)
		}
		defer f.Close()

		data := make([]byte, 1024*1024)
		for i := 0; i < 10; i++ {
			_, err := f.Write(data)
			if err != nil {
				t.Fatalf("Failed to write to large temp file: %v", err)
			}
		}

		hash, err := FileHash(tempFile)
		if err != nil {
			t.Fatalf("FileHash failed for large file: %v", err)
		}

		if len(hash) != 64 {
			t.Errorf("Unexpected hash length for large file. Expected 64, Got: %d", len(hash))
		}
	})
}

func TestTree(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "tree-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	err = os.MkdirAll(filepath.Join(tempDir, "subdir"), 0755)
	if err != nil {
		t.Fatalf("Failed to create subdirectory: %v", err)
	}

	files := map[string]string{
		"file1.txt":        "Content of file1",
		"file2.txt":        "Content of file2",
		"subdir/file3.txt": "Content of file3",
		"subdir/file4.txt": "Content of file4",
	}

	for path, content := range files {
		err := os.WriteFile(filepath.Join(tempDir, path), []byte(content), 0644)
		if err != nil {
			t.Fatalf("Failed to create test file %s: %v", path, err)
		}
	}

	result, err := Tree(tempDir)
	if err != nil {
		t.Fatalf("Tree function returned an error: %v", err)
	}

	expected := map[string][]byte{
		"file1.txt":        []byte("Content of file1"),
		"file2.txt":        []byte("Content of file2"),
		"subdir/file3.txt": []byte("Content of file3"),
		"subdir/file4.txt": []byte("Content of file4"),
	}

	if !reflect.DeepEqual(result, expected) {
		t.Errorf("Tree result does not match expected output.\nGot: %v\nExpected: %v", result, expected)
	}
}
