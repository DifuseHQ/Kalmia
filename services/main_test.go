package services

import (
	"os"
	"testing"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/logger"
)

var TestConfig *config.Config

func TestMain(m *testing.M) {
	TestConfig = config.ParseConfig("../config.json")

	logger.InitializeLogger("test", "debug", "./service_test_dir")

	code := m.Run()

	os.RemoveAll("./service_test_dir")
	os.Exit(code)
}
