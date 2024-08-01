package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"git.difuse.io/Difuse/kalmia/utils"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New(validator.WithRequiredStructEnabled())
}

func ValidateRequest[T any](w http.ResponseWriter, r *http.Request) (*T, error) {
	var req T
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "invalid_request_format"})
		return nil, err
	}

	err = validate.Struct(req)
	if err != nil {
		fmt.Println(err)
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "invalid_request_data"})
		return nil, err
	}

	return &req, nil
}

func SendJSONResponse(httpCode int, w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpCode)
	json.NewEncoder(w).Encode(data)
}

func GetTokenFromHeader(r *http.Request) (string, error) {
	token := r.Header.Get("Authorization")
	if token == "" {
		return "", fmt.Errorf("no token provided")
	}

	token = utils.RemoveSpaces(token[7:])

	return token, nil
}
