package middleware

import (
	"net/http"
	"strings"

	"git.difuse.io/Difuse/kalmia/handlers"
	"git.difuse.io/Difuse/kalmia/services"
)

func EnsureAuthenticated(authService *services.AuthService) func(http.Handler) http.Handler {
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
				if !authService.VerifyTokenInDb(token, true) {
					handlers.SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"error": "invalid_token"})
					return
				}
			}

			if !authService.VerifyTokenInDb(token, false) {
				handlers.SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"error": "invalid_token"})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
