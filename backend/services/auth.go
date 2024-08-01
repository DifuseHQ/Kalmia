package services

import (
	"fmt"

	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/utils"
	"gorm.io/gorm"
)

type AuthService struct {
	DB *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{DB: db}
}

func (service *AuthService) VerifyTokenInDb(token string, needAdmin bool) bool {
	var tokenRecord models.Token

	query := service.DB.Joins("JOIN users ON users.id = tokens.user_id").Where("tokens.token = ?", token).First(&tokenRecord)
	if query.Error != nil {
		return false
	}

	if needAdmin {
		var user models.User
		if err := service.DB.Where("id = ?", tokenRecord.UserID).First(&user).Error; err != nil {
			return false
		}
		if !user.Admin {
			return false
		}
	}

	_, err := utils.ValidateJWT(token)
	if err != nil {
		return false
	}

	return true
}

func (service *AuthService) IsTokenAdmin(token string) bool {
	var tokenRecord models.Token

	query := service.DB.Joins("JOIN users ON users.id = tokens.user_id").Where("tokens.token = ?", token).Select("users.admin").First(&tokenRecord)
	if query.Error != nil {
		return false
	}

	var user models.User
	if err := service.DB.Where("id = ?", tokenRecord.UserID).First(&user).Error; err != nil {
		return false
	}

	return user.Admin
}

func (service *AuthService) GetUserFromToken(token string) (models.User, error) {
	var tokenRecord models.Token

	query := service.DB.Where("token = ?", token).First(&tokenRecord)
	if query.Error != nil {
		return models.User{}, query.Error
	}

	var user models.User

	if err := service.DB.Where("id = ?", tokenRecord.UserID).First(&user).Error; err != nil {
		return models.User{}, err
	}

	return user, nil
}

func (service *AuthService) CreateUser(username, email, password string, admin bool) error {
	hashedPassword, err := utils.HashPassword(password)

	if err != nil {
		return fmt.Errorf("failed_to_hash_password")
	}

	user := models.User{
		Username: username,
		Email:    email,
		Password: hashedPassword,
		Admin:    admin,
	}

	if err := service.DB.Create(&user).Error; err != nil {
		return fmt.Errorf("failed_to_create_user")
	}

	return nil
}

func (service *AuthService) EditUser(id uint, username, email, password, photo string, admin bool) error {
	var user models.User

	if err := service.DB.Where("id = ?", id).First(&user).Error; err != nil {
		return fmt.Errorf("user_not_found")
	}

	if username != "" {
		user.Username = username
	}

	if email != "" {
		user.Email = email
	}

	if password != "" {
		hashedPassword, err := utils.HashPassword(password)
		if err != nil {
			return fmt.Errorf("failed_to_hash_password")
		}

		user.Password = hashedPassword
	}

	if photo != "" {
		user.Photo = photo
	}

	user.Admin = admin

	if err := service.DB.Save(&user).Error; err != nil {
		return fmt.Errorf("failed_to_edit_user")
	}

	return nil
}

func (service *AuthService) DeleteUser(username string) error {
	var user models.User

	if err := service.DB.Where("username = ?", username).First(&user).Error; err != nil {
		return fmt.Errorf("user_not_found")
	}

	if err := service.DB.Delete(&user).Error; err != nil {
		return fmt.Errorf("failed_to_delete_user")
	}

	return nil
}

func (service *AuthService) GetUsers() ([]models.User, error) {
	var users []models.User

	if err := service.DB.Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed_to_get_users")
	}

	return users, nil
}

func (service *AuthService) GetUser(id uint) (models.User, error) {
	var user models.User

	if err := service.DB.Where("id = ?", id).First(&user).Error; err != nil {
		return models.User{}, fmt.Errorf("user_not_found")
	}

	return user, nil
}

func (service *AuthService) CreateJWT(username, password string) (map[string]interface{}, error) {
	var user models.User

	if err := service.DB.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, fmt.Errorf("user_not_found")
	}

	if !utils.CheckPasswordHash(password, user.Password) {
		return nil, fmt.Errorf("invalid_password")
	}

	tokenString, expiry, err := utils.GenerateJWTAccessToken(user.ID, user.Username, user.Email, user.Photo, user.Admin)
	if err != nil {
		return nil, fmt.Errorf("failed_to_generate_jwt")
	}

	newToken := models.Token{
		UserID: user.ID,
		Token:  tokenString,
		Expiry: expiry,
	}

	if err := service.DB.Create(&newToken).Error; err != nil {
		return nil, fmt.Errorf("failed_to_create_token")
	}

	claims, err := utils.ValidateJWT(tokenString)
	if err != nil {
		service.DB.Where("token = ?", tokenString).Delete(&models.Token{})
		return nil, fmt.Errorf("invalid_jwt_created")
	}

	return map[string]interface{}{
		"token":    tokenString,
		"expiry":   claims.ExpiresAt.Time.String(),
		"email":    claims.Email,
		"username": claims.Username,
		"photo":    claims.Photo,
		"userId":   claims.UserId,
		"admin":    user.Admin,
	}, nil
}

func (service *AuthService) RefreshJWT(token string) (string, error) {
	claims, err := utils.ValidateJWT(token)
	if err != nil {
		return "", fmt.Errorf("invalid_jwt")
	}

	userId, err := utils.StringToUint(claims.UserId)
	if err != nil {
		return "", fmt.Errorf("failed_to_convert_user_id")
	}

	newToken, expiry, err := utils.GenerateJWTAccessToken(userId, claims.Username, claims.Email, claims.Photo, claims.IsAdmin)
	if err != nil {
		return "", fmt.Errorf("failed_to_generate_new_jwt")
	}

	var tokenRecord models.Token

	if err := service.DB.Where("token = ?", token).First(&tokenRecord).Error; err != nil {
		return "", fmt.Errorf("token_not_found")
	}

	tokenRecord.Token = newToken
	tokenRecord.Expiry = expiry

	if err := service.DB.Save(&tokenRecord).Error; err != nil {
		fmt.Println(err)
		return "", fmt.Errorf("failed_to_update_token")
	}

	return newToken, nil
}

func (service *AuthService) ValidateJWT(token string) (map[string]interface{}, error) {
	var tokenRecord models.Token

	if err := service.DB.Where("token = ?", token).First(&tokenRecord).Error; err != nil {
		return nil, fmt.Errorf("token_not_found")
	}

	claims, err := utils.ValidateJWT(token)

	if err != nil {
		return nil, fmt.Errorf("invalid_jwt")
	}

	return map[string]interface{}{
		"email":    claims.Email,
		"username": claims.Username,
		"photo":    claims.Photo,
		"expiry":   claims.ExpiresAt.Time.String(),
		"admin":    claims.IsAdmin,
		"userId":   claims.UserId,
	}, nil
}

func (service *AuthService) RevokeJWT(token string) error {
	_, err := utils.ValidateJWT(token)

	if err != nil {
		return fmt.Errorf("invalid_jwt")
	}

	var tokenRecord models.Token

	if err := service.DB.Where("token = ?", token).First(&tokenRecord).Error; err != nil {
		return fmt.Errorf("token_not_found")
	}

	if err := service.DB.Delete(&tokenRecord).Error; err != nil {
		return fmt.Errorf("failed_to_delete_token")
	}

	return nil
}
