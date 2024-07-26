package config

import (
	"encoding/json"
	"os"
)

type User struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Admin    bool   `json:"admin"`
}

type Cloudflare struct {
	AccountID string `json:"account_id"`
	APIKey    string `json:"api_key"`
}

type Config struct {
	Environment   string     `json:"environment"`
	Port          int        `json:"port"`
	DatabaseURL   string     `json:"database_url"`
	LogLevel      string     `json:"log_level"`
	SessionSecret string     `json:"session_secret"`
	Admins        []User     `json:"users"`
	DataPath      string     `json:"data_path"`
	AddDummyData  bool       `json:"addDummyData"`
	Cloudflare    Cloudflare `json:"cloudflare"`
}

var ParsedConfig *Config

func ParseConfig(path string) *Config {
	file, err := os.Open(path)

	if err != nil {
		panic(err)
	}

	defer file.Close()

	decoder := json.NewDecoder(file)
	ParsedConfig = &Config{}
	err = decoder.Decode(ParsedConfig)

	if err != nil {
		panic(err)
	}

	err = SetupDataPath()

	if err != nil {
		panic(err)
	}

	return ParsedConfig
}

func SetupDataPath() error {
	if ParsedConfig.DataPath == "" {
		ParsedConfig.DataPath = "./data"
	}

	if _, err := os.Stat(ParsedConfig.DataPath); os.IsNotExist(err) {
		err := os.Mkdir(ParsedConfig.DataPath, 0755)
		if err != nil {
			return err
		}
	}

	if _, err := os.Stat(ParsedConfig.DataPath + "/docusaurus_data"); os.IsNotExist(err) {
		err := os.Mkdir(ParsedConfig.DataPath+"/docusaurus_data", 0755)
		if err != nil {
			return err
		}
	}

	return nil
}
