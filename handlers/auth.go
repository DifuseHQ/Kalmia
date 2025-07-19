package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/services"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"

	"golang.org/x/oauth2/google"
	"golang.org/x/oauth2/microsoft"
	"gorm.io/gorm"

	githubClient "github.com/google/go-github/v39/github"
)

var (
	githubOauthConfig    *oauth2.Config
	microsoftOauthConfig *oauth2.Config
	googleOAuthConfig    *oauth2.Config
)

func CreateUser(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Username    string   `json:"username" validate:"required,alphanum"`
		Email       string   `json:"email" validate:"required,email"`
		Password    string   `json:"password" validate:"required"`
		Admin       bool     `json:"admin"`
		Permissions []string `json:"permissions" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)
	if err != nil {
		return
	}

	err = authService.CreateUser(req.Username, req.Email, req.Password, req.Admin, req.Permissions)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error(), "error": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success"})
}

func EditUser(authService *services.AuthService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID          uint     `json:"id" validate:"required"`
		Username    string   `json:"username" validate:"omitempty,alphanum"`
		Email       string   `json:"email" validate:"omitempty,email"`
		Password    string   `json:"password" validate:"omitempty,min=8,max=32"`
		Photo       string   `json:"photo" validate:"omitempty,http_url"`
		Admin       int      `json:"admin" validate:"omitempty"`
		Permissions []string `json:"permissions" validate:"omitempty"`
	}

	req, err := ValidateRequest[Request](w, r)
	if err != nil {
		return
	}

	err = authService.EditUser(req.ID, req.Username, req.Email, req.Password, req.Photo, req.Admin, req.Permissions)
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

	token, err := GetTokenFromHeader(r)
	if err != nil {
		return
	}

	if !authService.IsTokenAdmin(token) {
		user, err := authService.GetUserFromToken(token)
		if err != nil {
			SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_token"})
			return
		}

		req.Id = user.ID
	}

	user, err := authService.GetUser(req.Id)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, user)
}

func UploadFile(db *gorm.DB, w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	// Capped at MaxFileSize set by the user
	err := r.ParseMultipartForm(cfg.MaxFileSize << 20)
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

	if header.Size > cfg.MaxFileSize<<20 {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "file_too_large"})
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "failed_to_read_file"})
		return
	}

	contentType := http.DetectContentType(fileBytes)

	fmt.Println("Request URI: ", r.RequestURI)

	fileURL, err := services.UploadToS3Storage(bytes.NewReader(fileBytes), header.Filename, contentType, cfg)
	if err != nil {

		fmt.Println(fmt.Errorf("ERROR uploading: %v", err))
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "failed_to_upload_file"})
		return
	}

	fmt.Println("File URL: ", fileURL)
	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "file_uploaded", "file": fileURL})
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

	emails, _, err := client.Users.ListEmails(context.Background(), nil)
	if err != nil {
		http.Error(w, "Failed to get user emails: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var foundEmail string

	for _, email := range emails {
		if email.GetEmail() != "" {
			_, err := aS.FindUserByEmail(email.GetEmail())
			if err == nil {
				foundEmail = email.GetEmail()
				break
			}

			if err.Error() == "user_not_found" {
				continue
			}

			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if foundEmail == "" {
		http.Redirect(w, r, "/admin/error/401", http.StatusTemporaryRedirect)
		return
	}

	tokenDetails, err := aS.CreateJWTFromEmail(foundEmail)
	if err != nil {
		http.Redirect(w, r, "/admin/error/401", http.StatusTemporaryRedirect)
		return
	}

	http.Redirect(w, r, fmt.Sprintf("/admin/login/gh?token=%s", tokenDetails), http.StatusTemporaryRedirect)
}

func getMicrosoftOauthConfig() *oauth2.Config {
	if microsoftOauthConfig == nil {
		microsoftOauthConfig = &oauth2.Config{
			ClientID:     config.ParsedConfig.MicrosoftOAuth.ClientID,
			ClientSecret: config.ParsedConfig.MicrosoftOAuth.ClientSecret,
			RedirectURL:  config.ParsedConfig.MicrosoftOAuth.RedirectURL,
			Scopes:       []string{"https://graph.microsoft.com/User.Read"},
			Endpoint:     microsoft.AzureADEndpoint("common"),
		}
	}

	return microsoftOauthConfig
}

func MicrosoftLogin(aS *services.AuthService, w http.ResponseWriter, r *http.Request) {
	if config.ParsedConfig.MicrosoftOAuth.ClientID == "" || config.ParsedConfig.MicrosoftOAuth.ClientSecret == "" {
		http.Error(w, "Microsoft OAuth not configured", http.StatusInternalServerError)
		return
	}
	microsoftOauthCfg := getMicrosoftOauthConfig()
	url := microsoftOauthCfg.AuthCodeURL("")
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func MicrosoftCallback(aS *services.AuthService, w http.ResponseWriter, r *http.Request) {
	if config.ParsedConfig.MicrosoftOAuth.ClientID == "" || config.ParsedConfig.MicrosoftOAuth.ClientSecret == "" {
		http.Error(w, "Microsoft OAuth not configured", http.StatusInternalServerError)
		return
	}
	microsoftOauthCfg := getMicrosoftOauthConfig()
	code := r.FormValue("code")
	token, err := microsoftOauthCfg.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	client := microsoftOauthCfg.Client(context.Background(), token)
	resp, err := client.Get("https://graph.microsoft.com/v1.0/me")
	if err != nil {
		http.Error(w, "Failed to get user info: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response body: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var userInfo struct {
		Email string `json:"mail"`
	}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		http.Error(w, "Failed to parse user info: "+err.Error(), http.StatusInternalServerError)
		return
	}

	email := userInfo.Email
	if email == "" {
		http.Redirect(w, r, "/admin/error/401", http.StatusUnauthorized)
		return
	}

	dbUser, err := aS.FindUserByEmail(email)
	if err != nil {
		http.Redirect(w, r, "/admin/error/401", http.StatusUnauthorized)
		return
	}

	tokenDetails, err := aS.CreateJWTFromEmail(dbUser.Email)
	if err != nil {
		http.Redirect(w, r, "/admin/error/401", http.StatusTemporaryRedirect)
		return
	}

	http.Redirect(w, r, fmt.Sprintf("/admin/login/ms?token=%s", tokenDetails), http.StatusTemporaryRedirect)
}

func getGoogleOAuthConfig() *oauth2.Config {
	if googleOAuthConfig == nil {
		googleOAuthConfig = &oauth2.Config{
			ClientID:     config.ParsedConfig.GoogleOAuth.ClientID,
			ClientSecret: config.ParsedConfig.GoogleOAuth.ClientSecret,
			RedirectURL:  config.ParsedConfig.GoogleOAuth.RedirectURL,
			Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
			Endpoint:     google.Endpoint,
		}
	}
	return googleOAuthConfig
}

func GoogleLogin(aS *services.AuthService, w http.ResponseWriter, r *http.Request) {
	if config.ParsedConfig.GoogleOAuth.ClientID == "" || config.ParsedConfig.GoogleOAuth.ClientSecret == "" {
		http.Error(w, "Google OAuth not configured", http.StatusInternalServerError)
		return
	}
	googleOAuthCfg := getGoogleOAuthConfig()
	url := googleOAuthCfg.AuthCodeURL("state", oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func GoogleCallback(aS *services.AuthService, w http.ResponseWriter, r *http.Request) {
	if config.ParsedConfig.GoogleOAuth.ClientID == "" || config.ParsedConfig.GoogleOAuth.ClientSecret == "" {
		http.Error(w, "Google OAuth not configured", http.StatusInternalServerError)
		return
	}

	googleOAuthCfg := getGoogleOAuthConfig()
	code := r.FormValue("code")
	token, err := googleOAuthCfg.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	email, err := getGoogleUserEmail(token.AccessToken)
	if err != nil {
		http.Error(w, "Failed to get user email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if email == "" {
		http.Redirect(w, r, "/admin/error/401", http.StatusTemporaryRedirect)
		return
	}

	dbUser, err := aS.FindUserByEmail(email)
	if err != nil {
		http.Redirect(w, r, "/admin/error/401", http.StatusTemporaryRedirect)
		return
	}

	tokenDetails, err := aS.CreateJWTFromEmail(dbUser.Email)
	if err != nil {
		http.Redirect(w, r, "/admin/error/401", http.StatusTemporaryRedirect)
		return
	}

	http.Redirect(w, r, fmt.Sprintf("/admin/login/gg?token=%s", tokenDetails), http.StatusTemporaryRedirect)
}

func getGoogleUserEmail(accessToken string) (string, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	return result.Email, nil
}

func GetOAuthProviders(aS *services.AuthService, w http.ResponseWriter, r *http.Request) {
	providers := aS.OAuthProviders()
	SendJSONResponse(http.StatusOK, w, providers)
}
