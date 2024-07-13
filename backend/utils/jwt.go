package utils

import (
	"fmt"
	"github.com/golang-jwt/jwt/v4"
	"time"
)

type JWTData struct {
	jwt.RegisteredClaims
	CustomClaims map[string]string `json:"custom_claims"`
	UserId       string            `json:"user_id"`
	Username     string            `json:"username"`
	Email        string            `json:"email"`
	Photo        string            `json:"photo"`
}

func GenerateJWTAccessToken(dbUserId uint, userId string, email string, photo string) (string, int64, error) {
	claims := JWTData{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)),
		},
		CustomClaims: map[string]string{
			"user_id": userId,
			"email":   email,
		},
		UserId:   fmt.Sprintf("%d", dbUserId),
		Username: userId,
		Email:    email,
		Photo:    photo,
	}

	tokenString := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err := tokenString.SignedString(secretKey)

	expiry := claims.ExpiresAt.Time.Unix()

	return token, expiry, err
}

func GetJWTExpirationTime(token string) (int64, error) {
	claims := &JWTData{}
	_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return secretKey, nil
	})

	if err != nil {
		return 0, err
	}

	return claims.ExpiresAt.Time.Unix(), nil
}

func ValidateJWT(token string) (*JWTData, error) {
	claims := &JWTData{}
	_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	return claims, nil
}

func GetJWTUserId(token string) (string, error) {
	claims, err := ValidateJWT(token)
	if err != nil {
		return "", err
	}

	return claims.UserId, nil
}
