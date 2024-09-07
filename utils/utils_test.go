package utils

import (
	"os"
	"testing"

	"git.difuse.io/Difuse/kalmia/logger"
)

var testDataPath string

func TestMain(m *testing.M) {
	var err error

	testDataPath, err = os.MkdirTemp("", "kalmia-test")

	if err != nil {
		panic("Failed to create temp directory for tests: " + err.Error())
	}

	logger.InitializeLogger("dev", "debug", testDataPath)

	code := m.Run()

	os.RemoveAll(testDataPath)
	os.Exit(code)
}

func createTempTestDir(t *testing.T) string {
	t.Helper()
	dir, err := os.MkdirTemp("", "utils-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	return dir
}

func abs(a int64) int64 {
	if a < 0 {
		return -a
	}
	return a
}
