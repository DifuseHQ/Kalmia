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

	TestConfig.Environment = "debug"
	TestConfig.Port = 3737
	TestConfig.LogLevel = "debug"
	TestConfig.Database = "sqlite"
	TestConfig.SessionSecret = "test-secret"

	adminUser := config.User{
		Username: "admin",
		Email:    "admin@kalmia.difuse.io",
		Password: "admin",
		Admin:    true,
	}

	nonAdminUser := config.User{
		Username: "user",
		Email:    "user@kalmia.difuse.io",
		Password: "user",
		Admin:    false,
	}

	TestConfig.Admins = append(TestConfig.Admins, adminUser, nonAdminUser)

	logger.InitializeLogger("test", "debug", "./service_test_dir")
	code := m.Run()

	os.RemoveAll("./service_test_dir")
	os.Exit(code)
}
