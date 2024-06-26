package handlers

import (
	"git.difuse.io/Difuse/kalmia/logger"
	"net/http"
)

func HealthPing(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, err := w.Write([]byte(`{"pong":1}`))
	if err != nil {
		logger.Error("Failed to write response")
	}
}
