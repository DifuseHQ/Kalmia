package utils

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"net/url"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

var secretKey = []byte("7snz7jkVnaLDGnfzcslcKJ6dwSOb4iGHMTe9S7Sj")

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func ToLowerCase(input string) string {
	return strings.ToLower(input)
}

func RemoveSpaces(input string) string {
	return strings.ReplaceAll(input, " ", "")
}

func StringToUint(input string) (uint, error) {
	output, err := strconv.ParseUint(input, 10, 32)

	if err != nil {
		return 0, err
	}

	return uint(output), nil
}

func StringToFileString(input string) string {
	input = strings.TrimSpace(input)
	input = strings.ToLower(input)
	reg := regexp.MustCompile(`[^\p{L}\p{N}]+`)
	input = reg.ReplaceAllString(input, "-")
	input = strings.Trim(input, "-")
	reg = regexp.MustCompile(`-+`)
	input = reg.ReplaceAllString(input, "-")
	if len(input) > 50 {
		input = input[:50]
	}
	if input == "" {
		return "unnamed-file"
	}
	return url.PathEscape(input)
}

func UintPtr(v uint) *uint {
	return &v
}

func TimePtr(v time.Time) *time.Time {
	return &v
}

func ReplaceMany(input string, replacements map[string]string) string {
	for k, v := range replacements {
		input = strings.ReplaceAll(input, k, v)
	}
	return input
}

func IsBaseURLValid(input string) bool {
	invalidBaseURLs := []string{"admin", "docs", "auth", "oauth", "health"}
	input = ToLowerCase(strings.Trim(input, "/"))

	if input == "" {
		return false
	}

	for _, invalidBaseURL := range invalidBaseURLs {
		if input == invalidBaseURL {
			return false
		}
	}

	return true
}

func ConvertToEmoji(codePoint string) string {
	codePoint = strings.TrimPrefix(strings.ToUpper(codePoint), "U+")
	codePointInt, err := strconv.ParseInt(codePoint, 16, 32)
	if err != nil {
		return "Invalid code point"
	}
	return string(rune(codePointInt))
}

func GetContentType(filename string) string {
	ext := filepath.Ext(filename)
	switch strings.ToLower(ext) {
	case ".html", ".htm":
		return "text/html"
	case ".css":
		return "text/css"
	case ".js":
		return "application/javascript"
	case ".json":
		return "application/json"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	default:
		return "application/octet-stream"
	}
}

func TrimFirstRune(s string) string {
	_, i := utf8.DecodeRuneInString(s)
	return s[i:]
}

func ArrayContains(arr []string, value string) bool {
	for _, item := range arr {
		if item == value {
			return true
		}
	}
	return false
}

func ToBase64(input string) string {
	return base64.StdEncoding.EncodeToString([]byte(input))
}

func HashStrings(data []string) string {
	h := sha256.New()
	h.Write([]byte(strings.Join(data, "")))
	return hex.EncodeToString(h.Sum(nil))
}
