package utils

import (
	"testing"
	"time"
)

func TestGenerateJWTAccessToken(t *testing.T) {
	dbUserId := uint(1)
	userId := "testUser"
	email := "test@example.com"
	photo := "photo.jpg"
	isAdmin := true

	token, expiry, err := GenerateJWTAccessToken(dbUserId, userId, email, photo, isAdmin)
	if err != nil {
		t.Fatalf("GenerateJWTAccessToken returned an error: %v", err)
	}
	if token == "" {
		t.Errorf("Generated token is empty")
	}
	expectedExpiry := time.Now().Add(time.Hour * 24).Unix()
	if abs(expiry-expectedExpiry) > 5 {
		t.Errorf("Expected expiry %d, got %d", expectedExpiry, expiry)
	}
}

func TestGetJWTExpirationTime(t *testing.T) {
	token, _, err := GenerateJWTAccessToken(1, "testUser", "test@example.com", "photo.jpg", true)
	if err != nil {
		t.Fatalf("GenerateJWTAccessToken returned an error: %v", err)
	}

	expiry, err := GetJWTExpirationTime(token)
	if err != nil {
		t.Fatalf("GetJWTExpirationTime returned an error: %v", err)
	}
	expectedExpiry := time.Now().Add(time.Hour * 24).Unix()
	if abs(expiry-expectedExpiry) > 5 {
		t.Errorf("Expected expiry %d, got %d", expectedExpiry, expiry)
	}
}

func TestValidateJWT(t *testing.T) {
	token, _, err := GenerateJWTAccessToken(1, "testUser", "test@example.com", "photo.jpg", true)
	if err != nil {
		t.Fatalf("GenerateJWTAccessToken returned an error: %v", err)
	}

	claims, err := ValidateJWT(token)
	if err != nil {
		t.Fatalf("ValidateJWT returned an error: %v", err)
	}
	if claims.UserId != "1" {
		t.Errorf("Expected UserId '1', got %s", claims.UserId)
	}
	if claims.Email != "test@example.com" {
		t.Errorf("Expected Email 'test@example.com', got %s", claims.Email)
	}
	if claims.IsAdmin != true {
		t.Errorf("Expected IsAdmin true, got %v", claims.IsAdmin)
	}
}

func TestGetJWTUserId(t *testing.T) {
	token, _, err := GenerateJWTAccessToken(1, "testUser", "test@example.com", "photo.jpg", true)
	if err != nil {
		t.Fatalf("GenerateJWTAccessToken returned an error: %v", err)
	}

	userId, err := GetJWTUserId(token)
	if err != nil {
		t.Fatalf("GetJWTUserId returned an error: %v", err)
	}
	if userId != "1" {
		t.Errorf("Expected UserId '1', got %s", userId)
	}
}
