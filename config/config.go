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

type GithubOAuth struct {
	ClientID     string `json:"clientId"`
	ClientSecret string `json:"clientSecret"`
	RedirectURL  string `json:"redirectURL"`
}

type Config struct {
	Environment   string      `json:"environment"`
	Port          int         `json:"port"`
	Database      string      `json:"database"`
	LogLevel      string      `json:"logLevel"`
	SessionSecret string      `json:"sessionSecret"`
	Admins        []User      `json:"users"`
	DataPath      string      `json:"dataPath"`
	AddDummyData  bool        `json:"addDummyData"`
	Cloudflare    Cloudflare  `json:"cloudflare"`
	GithubOAuth   GithubOAuth `json:"githubOAuth"`
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

	if _, err := os.Stat(ParsedConfig.DataPath + "/rspress_data"); os.IsNotExist(err) {
		err := os.Mkdir(ParsedConfig.DataPath+"/rspress_data", 0755)
		if err != nil {
			return err
		}
	}

	return nil
}
