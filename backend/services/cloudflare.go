package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"git.difuse.io/Difuse/kalmia/config"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"
)

func UploadImage(file io.Reader) (string, error) {
	apiURL := fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/images/v1", config.ParsedConfig.Cloudflare.AccountID)
	apiKey := config.ParsedConfig.Cloudflare.APIKey

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	filename := fmt.Sprintf("upload-%d", time.Now().Unix())
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}
	_, err = io.Copy(part, file)
	if err != nil {
		return "", err
	}

	writer.Close()

	req, err := http.NewRequest("POST", apiURL, body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("cloudflare API returned %d status", resp.StatusCode)
	}

	var result struct {
		Success bool                       `json:"success"`
		Errors  []struct{ Message string } `json:"errors"`
		Result  struct {
			ID       string   `json:"id"`
			Variants []string `json:"variants"`
		} `json:"result"`
	}

	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return "", err
	}

	if !result.Success {
		return "", fmt.Errorf("error from Cloudflare: %s", result.Errors[0].Message)
	}

	publicVariant := ""
	for _, variant := range result.Result.Variants {
		if strings.HasSuffix(variant, "public") {
			publicVariant = variant
			break
		}
	}

	if publicVariant == "" {
		return "", fmt.Errorf("no public variant found")
	}

	return publicVariant, nil
}
