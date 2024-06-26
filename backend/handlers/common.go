package handlers

import (
	"encoding/json"
	"fmt"
	"git.difuse.io/Difuse/kalmia/utils"
	"github.com/go-playground/validator/v10"
	"net/http"
)

var validate *validator.Validate

func init() {
	validate = validator.New(validator.WithRequiredStructEnabled())
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
