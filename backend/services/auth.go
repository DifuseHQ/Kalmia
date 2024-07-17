package services

import (
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/utils"
	"gorm.io/gorm"
)

func VerifyTokenInDb(db *gorm.DB, token string, needAdmin bool) bool {
	var tokenRecord models.Token

	query := db.Joins("JOIN users ON users.id = tokens.user_id").Where("tokens.token = ?", token).First(&tokenRecord)
	if query.Error != nil {
		return false
	}

	if needAdmin {
		var user models.User
		if err := db.Where("id = ?", tokenRecord.UserID).First(&user).Error; err != nil {
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

func IsTokenAdmin(db *gorm.DB, token string) bool {
	var tokenRecord models.Token

	query := db.Joins("JOIN users ON users.id = tokens.user_id").Where("tokens.token = ?", token).Select("users.admin").First(&tokenRecord)
	if query.Error != nil {
		return false
	}

	var user models.User
	if err := db.Where("id = ?", tokenRecord.UserID).First(&user).Error; err != nil {
		return false
	}

	return user.Admin
}

func GetUserFromToken(db *gorm.DB, token string) (models.User, error) {
	var tokenRecord models.Token

	query := db.Where("token = ?", token).First(&tokenRecord)
	if query.Error != nil {
		return models.User{}, query.Error
	}

	var user models.User

	if err := db.Where("id = ?", tokenRecord.UserID).First(&user).Error; err != nil {
		return models.User{}, err
	}

	return user, nil
}
