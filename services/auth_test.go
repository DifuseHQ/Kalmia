package services

import (
	"reflect"
	"testing"
	"time"

	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"go.uber.org/zap"
)

func TestGetUsers(t *testing.T) {
	if TestAuthService == nil {
		t.Fatal("TestAuthService is nil")
	}

	users, err := TestAuthService.GetUsers()
	if err != nil {
		t.Fatalf("GetUsers returned an error: %v", err)
	}

	expectedUsers := map[string]string{
		"admin": "admin@kalmia.difuse.io",
		"user":  "user@kalmia.difuse.io",
	}

	if len(users) != len(expectedUsers) {
		t.Errorf("Expected %d users, but got %d", len(expectedUsers), len(users))
	}

	for _, user := range users {
		expectedEmail, exists := expectedUsers[user.Username]
		if !exists {
			t.Errorf("Unexpected user found: %s", user.Username)
			continue
		}
		if user.Email != expectedEmail {
			t.Errorf("User %s has incorrect email. Expected %s, got %s", user.Username, expectedEmail, user.Email)
		}
		delete(expectedUsers, user.Username)
	}

	if len(expectedUsers) > 0 {
		for username := range expectedUsers {
			t.Errorf("Expected user not found: %s", username)
		}
	}
}

func TestCreateJWT(t *testing.T) {
	if TestAuthService == nil {
		t.Fatal("TestAuthService is nil")
	}

	t.Run("Successful JWT Creation", func(t *testing.T) {
		result, err := TestAuthService.CreateJWT("admin", "admin")
		if err != nil {
			t.Fatalf("Failed to create JWT: %v", err)
		}

		// Check if all expected fields are present
		expectedFields := []string{"token", "expiry", "email", "username", "photo", "userId", "admin", "permissions"}
		for _, field := range expectedFields {
			if _, ok := result[field]; !ok {
				t.Errorf("Expected field %s is missing from the result", field)
			}
		}

		// Verify some of the returned data
		if result["username"] != "admin" {
			t.Errorf("Expected username 'admin', got %v", result["username"])
		}
		if result["email"] != "admin@kalmia.difuse.io" {
			t.Errorf("Expected email 'admin@kalmia.difuse.io', got %v", result["email"])
		}
		if result["admin"] != true {
			t.Errorf("Expected admin to be true, got %v", result["admin"])
		}

		// Verify that the token was stored in the database
		var storedToken models.Token
		if err := TestAuthService.DB.Where("token = ?", result["token"]).First(&storedToken).Error; err != nil {
			t.Errorf("Token not found in database: %v", err)
		}
	})

	t.Run("Non-existent User", func(t *testing.T) {
		_, err := TestAuthService.CreateJWT("nonexistent", "password")
		if err == nil || err.Error() != "user_not_found" {
			t.Errorf("Expected 'user_not_found' error, got %v", err)
		}
	})

	t.Run("Incorrect Password", func(t *testing.T) {
		_, err := TestAuthService.CreateJWT("admin", "wrongpassword")
		if err == nil || err.Error() != "invalid_password" {
			t.Errorf("Expected 'invalid_password' error, got %v", err)
		}
	})
}

func TestVerifyTokenInDb(t *testing.T) {
	if TestAuthService == nil {
		t.Fatal("TestAuthService is nil")
	}

	createToken := func(username string) (string, error) {
		result, err := TestAuthService.CreateJWT(username, username)
		if err != nil {
			return "", err
		}
		return result["token"].(string), nil
	}

	t.Run("Valid Token - Non-Admin", func(t *testing.T) {
		token, err := createToken("user")
		if err != nil {
			t.Fatalf("Failed to create token: %v", err)
		}

		isValid := TestAuthService.VerifyTokenInDb(token, false)
		if !isValid {
			t.Errorf("Expected token to be valid, but it was not")
		}
	})

	t.Run("Valid Token - Admin Check for Non-Admin", func(t *testing.T) {
		token, err := createToken("user")
		if err != nil {
			t.Fatalf("Failed to create token: %v", err)
		}

		isValid := TestAuthService.VerifyTokenInDb(token, true)
		if isValid {
			t.Errorf("Expected token to be invalid for admin check, but it was valid")
		}
	})

	t.Run("Valid Token - Admin", func(t *testing.T) {
		token, err := createToken("admin")
		if err != nil {
			t.Fatalf("Failed to create token: %v", err)
		}

		isValid := TestAuthService.VerifyTokenInDb(token, true)
		if !isValid {
			t.Errorf("Expected admin token to be valid, but it was not")
		}
	})

	t.Run("Invalid Token", func(t *testing.T) {
		isValid := TestAuthService.VerifyTokenInDb("invalid_token", false)
		if isValid {
			t.Errorf("Expected invalid token to be rejected, but it was accepted")
		}
	})

	t.Run("Expired Token", func(t *testing.T) {
		token, err := createToken("user")
		if err != nil {
			t.Fatalf("Failed to create token: %v", err)
		}

		err = TestAuthService.DB.Model(&models.Token{}).Where("token = ?", token).Update("expiry", time.Now().Add(-1*time.Hour)).Error
		if err != nil {
			t.Fatalf("Failed to expire token: %v", err)
		}

		isValid := TestAuthService.VerifyTokenInDb(token, false)
		if isValid {
			t.Errorf("Expected expired token to be invalid, but it was valid")
		}
	})
}

func createToken(username, password string) (string, error) {
	result, err := TestAuthService.CreateJWT(username, password)
	if err != nil {
		logger.Error("Failed to create JWT", zap.Error(err))
		return "", err
	}
	return result["token"].(string), nil
}

func TestIsTokenAdmin(t *testing.T) {
	if TestAuthService == nil {
		t.Fatal("TestAuthService is nil")
	}

	t.Run("Admin Token", func(t *testing.T) {
		adminToken, err := createToken("admin", "admin")
		if err != nil {
			t.Fatalf("Failed to create admin token: %v", err)
		}

		isAdmin := TestAuthService.IsTokenAdmin(adminToken)
		if !isAdmin {
			t.Errorf("Expected admin token to be identified as admin, but it was not")
		}
	})

	t.Run("Non-Admin Token", func(t *testing.T) {
		userToken, err := createToken("user", "user")
		if err != nil {
			t.Fatalf("Failed to create user token: %v", err)
		}

		isAdmin := TestAuthService.IsTokenAdmin(userToken)
		if isAdmin {
			t.Errorf("Expected non-admin token to be identified as non-admin, but it was identified as admin")
		}
	})

	t.Run("Invalid Token", func(t *testing.T) {
		isAdmin := TestAuthService.IsTokenAdmin("invalid_token")
		if isAdmin {
			t.Errorf("Expected invalid token to be identified as non-admin, but it was identified as admin")
		}
	})

	t.Run("Deleted User Token", func(t *testing.T) {
		userName := "testuser" + time.Now().String()
		password := "testpassword"
		pwHash, err := utils.HashPassword(password)
		if err != nil {
			t.Fatalf("Failed to hash test password: %v", err)
		}
		testUser := models.User{
			Username:    userName,
			Email:       "testuser@example.com",
			Password:    pwHash,
			Admin:       false,
			Permissions: "[\"read\",\"write\",\"delete\"]",
		}
		if err := TestAuthService.DB.Create(&testUser).Error; err != nil {
			t.Fatalf("Failed to create test user: %v", err)
		}

		userToken, err := createToken(userName, password)
		if err != nil {
			t.Fatalf("Failed to create user token: %v", err)
		}

		if err := TestAuthService.DB.Where("user_id = ?", testUser.ID).Delete(&models.Token{}).Error; err != nil {
			t.Fatalf("Failed to delete associated tokens: %v", err)
		}

		if err := TestAuthService.DB.Unscoped().Delete(&testUser).Error; err != nil {
			t.Fatalf("Failed to delete test user: %v", err)
		}

		isAdmin := TestAuthService.IsTokenAdmin(userToken)
		if isAdmin {
			t.Errorf("Expected token for deleted user to be identified as non-admin, but it was identified as admin")
		}
	})
}

func TestGetUserPermissions(t *testing.T) {
	if TestAuthService == nil {
		t.Fatal("TestAuthService is nil")
	}

	t.Run("Admin Permissions", func(t *testing.T) {
		adminToken, err := createToken("admin", "admin")
		if err != nil {
			t.Fatalf("Failed to create admin token: %v", err)
		}

		permissions, err := TestAuthService.GetUserPermissions(adminToken)
		if err != nil {
			t.Fatalf("Failed to get admin permissions: %v", err)
		}

		if len(permissions) != 1 || permissions[0] != "all" {
			t.Errorf("Expected admin permissions to be [\"all\"], got %v", permissions)
		}
	})

	t.Run("Regular User Permissions", func(t *testing.T) {
		userToken, err := createToken("user", "user")
		if err != nil {
			t.Fatalf("Failed to create user token: %v", err)
		}

		permissions, err := TestAuthService.GetUserPermissions(userToken)
		if err != nil {
			t.Fatalf("Failed to get user permissions: %v", err)
		}

		expectedPermissions := []string{"read", "write", "delete"}
		if !reflect.DeepEqual(permissions, expectedPermissions) {
			t.Errorf("Expected user permissions to be %v, got %v", expectedPermissions, permissions)
		}
	})

	t.Run("Custom User with Read Permission", func(t *testing.T) {
		userName := "readonlyuser" + time.Now().String()
		password := "testpassword"
		pwHash, err := utils.HashPassword(password)
		if err != nil {
			t.Fatalf("Failed to hash test password: %v", err)
		}

		testUser := models.User{
			Username:    userName,
			Email:       "readonly@example.com",
			Password:    pwHash,
			Admin:       false,
			Permissions: "[\"read\"]",
		}
		if err := TestAuthService.DB.Create(&testUser).Error; err != nil {
			t.Fatalf("Failed to create test user: %v", err)
		}
		defer func() {
			// Delete associated tokens first
			if err := TestAuthService.DB.Where("user_id = ?", testUser.ID).Delete(&models.Token{}).Error; err != nil {
				t.Fatalf("Failed to delete associated tokens: %v", err)
			}
			// Then delete the user
			if err := TestAuthService.DB.Unscoped().Delete(&testUser).Error; err != nil {
				t.Fatalf("Failed to delete test user: %v", err)
			}
		}()

		userToken, err := createToken(userName, password)
		if err != nil {
			t.Fatalf("Failed to create user token: %v", err)
		}

		permissions, err := TestAuthService.GetUserPermissions(userToken)
		if err != nil {
			t.Fatalf("Failed to get user permissions: %v", err)
		}

		expectedPermissions := []string{"read"}
		if !reflect.DeepEqual(permissions, expectedPermissions) {
			t.Errorf("Expected user permissions to be %v, got %v", expectedPermissions, permissions)
		}
	})

	t.Run("Invalid Token", func(t *testing.T) {
		_, err := TestAuthService.GetUserPermissions("invalid_token")
		if err == nil {
			t.Error("Expected error for invalid token, got nil")
		}
	})
}
