package services

import (
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/utils"
	"gorm.io/gorm"
)

func VerifyTokenInDb(db *gorm.DB, token string, needAdmin bool) bool {
	var user models.User

	err := db.Where("jwt = ?", token).First(&user).Error

	if err != nil {
		return false
	}

	if needAdmin && !user.Admin {
		return false
	}

	_, err = utils.ValidateJWT(token)

	if err != nil {
		return false
	}

	return true
}
