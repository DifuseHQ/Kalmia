package middleware

import (
	"net/http"

	"git.difuse.io/Difuse/kalmia/handlers"
	"git.difuse.io/Difuse/kalmia/services"
	"git.difuse.io/Difuse/kalmia/utils"
)

func EnsureAuthenticated(authService *services.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/auth/jwt/create" {
				next.ServeHTTP(w, r)
				return
			}

			token, err := handlers.GetTokenFromHeader(r)

			if err != nil || !authService.VerifyTokenInDb(token, false) {
				handlers.SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"error": "invalid_token"})
				return
			}

			isAdminToken := authService.IsTokenAdmin(token)
			permissions, err := authService.GetUserPermissions(token)

			if err != nil {
				handlers.SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"error": "user_permissions_error"})
				return
			}

			if !hasPermissionForRoute(r.URL.Path, permissions, isAdminToken) {
				handlers.SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"error": "user_unauthorized_route"})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func hasPermissionForRoute(path string, permissions []string, isAdmin bool) bool {
	if isAdmin {
		return true
	}

	routePermissions := map[string]string{
		"/auth/user":                       "read",
		"/auth/users":                      "read",
		"/auth/user/edit":                  "read",
		"/auth/jwt/revoke":                 "read",
		"/auth/jwt/validate":               "read",
		"/auth/user/upload-file":           "read",
		"/docs/documentations":             "read",
		"/docs/pages":                      "read",
		"/docs/page-groups":                "read",
		"/docs/documentation":              "read",
		"/docs/page":                       "read",
		"/docs/page-group":                 "read",
		"/docs/documentation/edit":         "write",
		"/docs/documentation/version":      "write",
		"/docs/documentation/reorder-bulk": "write",
		"/docs/page/edit":                  "write",
		"/docs/page-group/edit":            "write",
		"/docs/documentation/delete":       "delete",
		"/docs/page/delete":                "delete",
		"/docs/page-group/delete":          "delete",
	}

	requiredPermission, exists := routePermissions[path]
	if !exists {
		return false
	}

	return utils.ArrayContains(permissions, requiredPermission)
}
