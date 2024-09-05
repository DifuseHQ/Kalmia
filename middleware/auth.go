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
			if r.URL.Path == "/kal-api/auth/jwt/create" ||
				r.URL.Path == "/kal-api/auth/jwt/validate" ||
				r.URL.Path == "/admin/error" ||
				r.URL.Path == "/admin/404" {
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
		"/kal-api/auth/user":                       "read",
		"/kal-api/auth/users":                      "read",
		"/kal-api/auth/user/edit":                  "read",
		"/kal-api/auth/jwt/revoke":                 "read",
		"/kal-api/auth/jwt/validate":               "read",
		"/kal-api/auth/user/upload-file":           "read",
		"/kal-api/docs/documentations":             "read",
		"/kal-api/docs/pages":                      "read",
		"/kal-api/docs/page-groups":                "read",
		"/kal-api/docs/documentation":              "read",
		"/kal-api/docs/page":                       "read",
		"/kal-api/docs/page-group":                 "read",
		"/kal-api/docs/documentation/create":       "write",
		"/kal-api/docs/documentation/edit":         "write",
		"/kal-api/docs/documentation/version":      "write",
		"/kal-api/docs/documentation/reorder-bulk": "write",
		"/kal-api/docs/page/create":                "write",
		"/kal-api/docs/page/edit":                  "write",
		"/kal-api/docs/page-group/create":          "write",
		"/kal-api/docs/page-group/edit":            "write",
		"/kal-api/docs/documentation/delete":       "delete",
		"/kal-api/docs/page/delete":                "delete",
		"/kal-api/docs/page-group/delete":          "delete",
	}

	requiredPermission, exists := routePermissions[path]

	if !exists {
		return false
	}

	return utils.ArrayContains(permissions, requiredPermission)
}
