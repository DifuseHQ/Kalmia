package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/services"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"gorm.io/gorm"

	githubClient "github.com/google/go-github/v39/github"
)

var githubOauthConfig *oauth2.Config

func CreateUser(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Username string `json:"username" validate:"required,alphanum"`
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
		Admin    bool   `json:"admin"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	err = authService.CreateUser(req.Username, req.Email, req.Password, req.Admin)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success"})
}

func EditUser(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID       uint   `json:"id" validate:"required"`
		Username string `json:"username" validate:"alphanum"`
		Email    string `json:"email" validate:"email"`
		Password string `json:"password" validate:"omitempty,min=8,max=32"`
		Photo    string `json:"photo" validate:"http_url"`
		Admin    bool   `json:"admin" validate:"boolean"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	err = authService.EditUser(req.ID, req.Username, req.Email, req.Password, req.Photo, req.Admin)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success"})
}

func DeleteUser(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Username string `json:"username" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	err = authService.DeleteUser(req.Username)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}
}

func GetUsers(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	users, err := authService.GetUsers()

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, users)
}

func GetUser(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Id uint `json:"id" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	user, err := authService.GetUser(req.Id)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, user)
}

func UploadPhoto(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "failed_to_parse_form"})
		return
	}

	file, header, err := r.FormFile("upload")
	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "failed_to_get_file"})
		return
	}
	defer file.Close()

	if header.Size > 10<<20 {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "file_too_large"})
		return
	}

	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "failed_to_read_file"})
		return
	}

	contentType := http.DetectContentType(buffer)
	if !strings.HasPrefix(contentType, "image/") {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "invalid_file_type"})
		return
	}

	if _, err := file.Seek(0, 0); err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "failed_to_reset_file_pointer"})
		return
	}

	imageURL, err := services.UploadImage(file)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "failed_to_upload_image"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "photo_uploaded", "photo": imageURL})
}

func CreateJWT(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	tokenDetails, err := authService.CreateJWT(req.Username, req.Password)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	tokenDetails["status"] = "success"

	SendJSONResponse(http.StatusOK, w, tokenDetails)
}

func RefreshJWT(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	headerToken, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	token, err := authService.RefreshJWT(headerToken)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "token": token})
}

func ValidateJWT(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	tokenDetails, err := authService.ValidateJWT(token)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	tokenDetails["status"] = "success"

	SendJSONResponse(http.StatusOK, w, tokenDetails)
}

func RevokeJWT(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	err = authService.RevokeJWT(token)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "token_revoked"})
}

func getGithubOauthConfig() *oauth2.Config {
	if githubOauthConfig == nil {
		githubOauthConfig = &oauth2.Config{
			ClientID:     config.ParsedConfig.GithubOAuth.ClientID,
			ClientSecret: config.ParsedConfig.GithubOAuth.ClientSecret,
			RedirectURL:  config.ParsedConfig.GithubOAuth.RedirectURL,
			Scopes:       []string{"user:email"},
			Endpoint:     github.Endpoint,
		}
	}

	return githubOauthConfig
}

func GithubLogin(aS *services.AuthService, w http.ResponseWriter, r *http.Request) {
	if config.ParsedConfig.GithubOAuth.ClientID == "" || config.ParsedConfig.GithubOAuth.ClientSecret == "" {
		http.Error(w, "Github OAuth not configured", http.StatusInternalServerError)
		return
	}

	githubOauthCfg := getGithubOauthConfig()

	url := githubOauthCfg.AuthCodeURL("")
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func GithubCallback(aS *services.AuthService, w http.ResponseWriter, r *http.Request) {
	if config.ParsedConfig.GithubOAuth.ClientID == "" || config.ParsedConfig.GithubOAuth.ClientSecret == "" {
		http.Error(w, "Github OAuth not configured", http.StatusInternalServerError)
		return
	}

	githubOauthCfg := getGithubOauthConfig()

	code := r.FormValue("code")
	token, err := githubOauthCfg.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	oauthClient := githubOauthCfg.Client(context.Background(), token)
	client := githubClient.NewClient(oauthClient)
	user, _, err := client.Users.Get(context.Background(), "")
	if err != nil {
		http.Error(w, "Failed to get user info: "+err.Error(), http.StatusInternalServerError)
		return
	}

	email := user.GetEmail()

	if email == "" {
		fmt.Println("No email found")
		http.Redirect(w, r, "/admin/401", http.StatusTemporaryRedirect)
		return
	}

	dbUser, err := aS.FindUserByEmail(email)

	if err != nil {
		fmt.Println("User not found")
		http.Redirect(w, r, "/admin/401", http.StatusTemporaryRedirect)
		return
	}

	tokenDetails, err := aS.CreateJWTFromEmail(dbUser.Email)

	if err != nil {
		fmt.Println("Failed to create token")
		http.Redirect(w, r, "/admin/401", http.StatusTemporaryRedirect)
		return
	}

	http.Redirect(w, r, fmt.Sprintf("/admin/login/gh?token=%s", tokenDetails), http.StatusTemporaryRedirect)
}