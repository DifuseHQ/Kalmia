package handlers

import (
	"encoding/json"
	"errors"
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"gorm.io/gorm"
	"net/http"
)

func CreateUser(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Username string `json:"username" validate:"required,alpha"`
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
		Admin    bool   `json:"admin"`
	}

	var req Request

	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err = validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to hash password"})
		return
	}

	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
		Admin:    req.Admin,
	}

	if err = db.Create(&user).Error; err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to create user"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success"})
}

func EditUser(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Username string `json:"username" validate:"required,alpha"`
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
		Admin    bool   `json:"admin" validate:"required,boolean"`
	}

	var req Request

	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err = validate.Struct(req)

	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var user models.User
	if err := db.Where("username = ?", req.Username).First(&user).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "User not found"})
		return
	}

	if req.Password != "" {
		hashedPassword, err := utils.HashPassword(req.Password)

		if err != nil {
			SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to hash password"})
			return
		}

		user.Password = hashedPassword
	}

	user.Email = req.Email
	user.Admin = req.Admin

	if err := db.Save(&user).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to edit user"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success"})
}

func DeleteUser(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Username string `json:"username" validate:"required"`
	}

	var req Request

	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err = validate.Struct(req)

	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var user models.User
	if err := db.Where("username = ?", req.Username).First(&user).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "User not found"})
		return
	}

	if err := db.Delete(&user).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete user"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success"})
}

func GetUsers(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to get users"})
		return
	}

	SendJSONResponse(http.StatusOK, w, users)
}

func GetUser(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	var Request struct {
		Username string `json:"username" validate:"required,alpha"`
	}

	err := json.NewDecoder(r.Body).Decode(&Request)

	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err = validate.Struct(Request)

	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var user models.User
	if err := db.Where("username = ?", Request.Username).First(&user).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "User not found"})
		return
	}

	SendJSONResponse(http.StatusOK, w, user)
}

func CreateJWT(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	var req Request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var user models.User
	if err := db.Where("username = ?", req.Username).First(&user).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "User not found"})
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Invalid password"})
		return
	}

	token, err := utils.GenerateJWTAccessToken(user.ID, user.Username, user.Email)
	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to generate JWT"})
		return
	}

	user.JWT = token

	jwtExpiry, err := utils.GetJWTExpirationTime(token)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to get JWT expiry"})
		return
	}

	user.JWTExpiry = jwtExpiry
	if err := db.Save(&user).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "token": token})
}

func RefreshJWT(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Token string `json:"token"`
	}

	var req Request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	claims, err := utils.ValidateJWT(req.Token)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Invalid or expired JWT"})
		return
	}

	userId, err := utils.StringToUint(claims.UserId)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to convert userId to uint"})
		return
	}

	newToken, err := utils.GenerateJWTAccessToken(uint(userId), claims.Username, claims.Email)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to generate new JWT"})
		return
	}

	db.Model(&models.User{}).Where("jwt = ?", req.Token).Update("jwt", newToken)

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	response := struct {
		Status string `json:"status"`
		Token  string `json:"token"`
	}{
		Status: "success",
		Token:  newToken,
	}
	json.NewEncoder(w).Encode(response)
}

func ValidateJWT(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Token string `json:"token"`
	}

	var req Request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	claims, err := utils.ValidateJWT(req.Token)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Invalid or expired JWT"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "claims": claims.Username})
}

func RevokeJWT(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Token string `json:"token"`
	}

	var req Request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	_, err = utils.ValidateJWT(req.Token)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Invalid or expired JWT"})
		return
	}

	var user models.User
	if err := db.Where("jwt = ?", req.Token).First(&user).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "User not found"})
		return
	}

	user.JWT = ""
	user.JWTExpiry = 0
	if err := db.Save(&user).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success"})
}
