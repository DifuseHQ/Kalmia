package handlers

import (
	"encoding/json"
	"net/http"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/services"
)

func ImportGitbook(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	var request struct {
		URL      string `json:"url"`
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "invalid_url", "error": err.Error()})
		return
	}

	if request.URL == "" {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "url_required"})
		return
	}

	jsonString, err := services.DocService.ImportGitbook(request.URL, request.Username, request.Password, cfg)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "gitbook_proccessing_failed", "error": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, jsonString)
}
