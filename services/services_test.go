package services

import (
	"os"
	"testing"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/db"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"go.uber.org/zap"
)

var TestConfig *config.Config
var TestAuthService *AuthService
var TestDocService *DocService

func TestMain(m *testing.M) {
	configJson := `{
		"environment": "debug",
		"port": 3737,
		"logLevel": "debug",
		"database": "sqlite",
		"sessionSecret": "test",
		"dataPath": "./service_test_dir",
		"users": [{"username": "admin", "email": "admin@kalmia.difuse.io", "password": "admin", "admin": true}, 
				  {"username": "user", "email": "user@kalmia.difuse.io", "password": "user", "admin": false}]
	}`

	err := utils.TouchFile("./config.json")

	if err != nil {
		panic(err)
	}

	prettyJson, err := utils.PrettyJSON(configJson)

	if err != nil {
		prettyJson = configJson
	}

	err = utils.WriteToFile("./config.json", prettyJson)

	if err != nil {
		panic(err)
	}

	TestConfig = config.ParseConfig("./config.json")

	logger.InitializeLogger("test", TestConfig.LogLevel, TestConfig.DataPath)

	d := db.SetupDatabase(TestConfig.Environment, TestConfig.Database, TestConfig.DataPath)
	db.SetupBasicData(d, TestConfig.Admins)
	db.InitCache()

	serviceRegistry := NewServiceRegistry(d)
	TestAuthService = serviceRegistry.AuthService
	TestDocService = serviceRegistry.DocService

	code := m.Run()

	err = utils.RemovePath(TestConfig.DataPath)

	if err != nil {
		logger.Error("Failed to remove test data path", zap.Error(err))
	}

	err = utils.RemovePath("./config.json")

	if err != nil {
		logger.Error("Failed to remove test config file: %v", zap.Error(err))
	}

	os.Exit(code)
}
