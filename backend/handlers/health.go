package handlers

import (
	"net/http"

	"git.difuse.io/Difuse/kalmia/logger"
	"go.uber.org/zap"
)

func HealthPing(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, err := w.Write([]byte(`{"pong":1}`))
	if err != nil {
		logger.Error("failed_to_write_response", zap.Error(err))
	}
}
