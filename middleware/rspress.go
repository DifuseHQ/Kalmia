package middleware

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"git.difuse.io/Difuse/kalmia/services"
)

func RsPressMiddleware(dS *services.DocService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			urlPath := r.URL.Path
			docPath, baseURL, err := dS.GetDocusaurus(urlPath)
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			fullPath := filepath.Join(docPath, strings.TrimPrefix(urlPath, baseURL))
			if _, err := os.Stat(fullPath); os.IsNotExist(err) {
				fullPath = filepath.Join(docPath, "index.html")
			}

			http.ServeFile(w, r, fullPath)
		})
	}
}
