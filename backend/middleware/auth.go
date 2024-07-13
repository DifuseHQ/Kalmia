package middleware

import (
	"git.difuse.io/Difuse/kalmia/handlers"
	"git.difuse.io/Difuse/kalmia/services"
	"gorm.io/gorm"
	"net/http"
	"strings"
)

func EnsureAuthenticated(db *gorm.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/auth/jwt/create" || r.URL.Path == "/user/edit" {
				next.ServeHTTP(w, r)
				return
			}

			token, err := handlers.GetTokenFromHeader(r)

			if err != nil {
				handlers.SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"error": "No token provided"})
				return
			}

			if strings.HasPrefix(r.URL.Path, "/user") && !strings.Contains(r.URL.Path, "/upload-photo") {
				if !services.VerifyTokenInDb(db, token, true) {
					handlers.SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"error": "Invalid Token"})
					return
				}
			}

			if !services.VerifyTokenInDb(db, token, false) {
				handlers.SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"error": "Invalid token"})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
