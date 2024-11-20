package utils

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

// Convert blocks to JSON string
func ConvertBlocksToJSONString(blocks []Block) (string, error) {
	jsonData, err := json.MarshalIndent(blocks, "", "  ")
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// Generate the slug with the /page- prefix
func GenerateSlug() string {
	b := make([]byte, 6)
	_, err := rand.Read(b)
	if err != nil {
		log.Fatal(err)
	}
	uniqueID := base64.RawURLEncoding.EncodeToString(b)
	uniqueID = strings.TrimRight(uniqueID, "=")
	return fmt.Sprintf("/page-%s", uniqueID)
}

// Generate unique IDs for blocks
func GenerateID() string {
	return uuid.New().String()
}

// Generate title
func TitleCreater(filename string) string {
	return strings.TrimSuffix(filename, filepath.Ext(filename))
}
