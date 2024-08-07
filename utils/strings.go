package utils

import (
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	crypt "github.com/simia-tech/crypt"
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

func GenerateSHA512(password, salt string) string {
	cryptSalt := fmt.Sprintf("$6$%s$", salt)
	hashedPassword, err := crypt.Crypt(password, cryptSalt)
	if err != nil {
		return ""
	}
	return hashedPassword
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

func StringToURLString(input string) string {
	input = strings.ToLower(input)
	return strings.ReplaceAll(input, " ", "-")
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
	invalidBaseURLs := []string{"admin", "/admin", "/admin/", "/docs", "/auth", "/oauth", "/health"}

	if input == "/" {
		return false
	}

	for _, invalidBaseURL := range invalidBaseURLs {
		if input == invalidBaseURL || strings.HasPrefix(input, invalidBaseURL) {
			return false
		}
	}

	return true
}
