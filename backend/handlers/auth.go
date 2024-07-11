package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/services"
	"git.difuse.io/Difuse/kalmia/utils"
	"gorm.io/gorm"
	"net/http"
	"strings"
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
	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "No token provided"})
		return
	}

	if !services.VerifyTokenInDb(db, token, false) {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Invalid token"})
		return
	}

	type Request struct {
		ID       uint   `json:"id" validate:"required"`
		Username string `json:"username" validate:"omitempty,alpha"`
		Email    string `json:"email" validate:"omitempty,email"`
		Password string `validate:"omitempty,min=8,max=32"`
		Photo    string `json:"photo" validate:"omitempty,http_url"`
		Admin    bool   `json:"admin" validate:"omitempty,boolean"`
	}

	var req Request

	err = json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err = validate.Struct(req)

	if err != nil {
		fmt.Println(err)
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var user models.User
	if err := db.Where("id = ?", req.ID).First(&user).Error; errors.Is(err, gorm.ErrRecordNotFound) {
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

	if req.Username != "" {
		user.Username = req.Username
	}

	if req.Email != "" {
		user.Email = req.Email
	}

	if req.Photo != "" {
		user.Photo = req.Photo
	}

	if services.IsTokenAdmin(db, token) {
		user.Admin = req.Admin
	}

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
	if err := db.Preload("Tokens").Find(&users).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to get users"})
		return
	}

	SendJSONResponse(http.StatusOK, w, users)
}

func GetUser(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	var request struct {
		Id uint `json:"id" validate:"required"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)

	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err = validate.Struct(request)

	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var user models.User
	if err := db.Preload("Tokens").Where("id = ?", request.Id).First(&user).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "User not found"})
		return
	}

	SendJSONResponse(http.StatusOK, w, user)
}

func UploadPhoto(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "No token provided"})
		return
	}

	if !services.VerifyTokenInDb(db, token, false) {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Invalid token"})
		return
	}

	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Failed to parse form"})
		return
	}

	file, header, err := r.FormFile("upload")
	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Failed to get file from form"})
		return
	}
	defer file.Close()

	if header.Size > 10<<20 {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "File size too large"})
		return
	}

	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to read file for MIME type check"})
		return
	}

	contentType := http.DetectContentType(buffer)
	if !strings.HasPrefix(contentType, "image/") {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Unsupported file type"})
		return
	}

	if _, err := file.Seek(0, 0); err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to reset file pointer"})
		return
	}

	imageURL, err := services.UploadImage(file)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": fmt.Sprintf("Failed to upload image: %v", err)})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Photo uploaded successfully", "photo": imageURL})
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

	tokenString, expiry, err := utils.GenerateJWTAccessToken(user.ID, user.Username, user.Email, user.Photo)
	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to generate JWT"})
		return
	}

	newToken := models.Token{
		UserID: user.ID,
		Token:  tokenString,
		Expiry: expiry,
	}

	if err := db.Create(&newToken).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	claims, err := utils.ValidateJWT(tokenString)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Invalid or expired JWT"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{
		"status":   "success",
		"token":    tokenString,
		"expiry":   claims.ExpiresAt.Time.String(),
		"email":    claims.Email,
		"username": claims.Username,
		"photo":    claims.Photo,
		"userId":   claims.UserId,
	})
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

	newToken, expiry, err := utils.GenerateJWTAccessToken(userId, claims.Username, claims.Email, claims.Photo)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to generate new JWT"})
		return
	}

	var token models.Token
	if err := db.Where("token = ?", req.Token).First(&token).Error; err != nil {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Token not found"})
		return
	}

	token.Token = newToken
	token.Expiry = expiry
	if err := db.Save(&token).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to update token"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "token": newToken})
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

	var token models.Token

	if err := db.Where("token = ?", req.Token).First(&token).Error; err != nil {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Token not found"})
		return
	}

	claims, err := utils.ValidateJWT(req.Token)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Invalid or expired JWT"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "email": claims.Email, "username": claims.Username, "photo": claims.Photo, "expiry": claims.ExpiresAt.Time.String()})
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

	result := db.Where("token = ?", req.Token).Delete(&models.Token{})
	if result.Error != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete token"})
		return
	}

	if result.RowsAffected == 0 {
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Token not found"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Token revoked successfully"})
}
