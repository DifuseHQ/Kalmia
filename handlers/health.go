package handlers

import (
	"net/http"

	"git.difuse.io/Difuse/kalmia/services"
)

func HealthPing(w http.ResponseWriter, r *http.Request) {
	SendJSONResponse(http.StatusOK, w, map[string]string{"pong": "1"})
}

func TriggerCheck(dS *services.DocService, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	lastTrigger, err := dS.GetLastTrigger()

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "internal_error", "error": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, lastTrigger)
}
