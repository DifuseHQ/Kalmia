package utils

import (
	"fmt"
	"strconv"
	"strings"

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
	return strings.ReplaceAll(input, " ", "_")
}
