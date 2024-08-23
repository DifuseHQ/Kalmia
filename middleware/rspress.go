package middleware

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"git.difuse.io/Difuse/kalmia/db"
	"git.difuse.io/Difuse/kalmia/services"
)

func RsPressMiddleware(dS *services.DocService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			urlPath := r.URL.Path
			docId, docPath, baseURL, err := dS.GetRsPress(urlPath)
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}
			fullPath := filepath.Join(docPath, strings.TrimPrefix(urlPath, baseURL))
			var fileKey string
			parts := strings.Split(fullPath, "/build/")
			if len(parts) > 1 {
				fileKey = parts[1]
			}

			// Check if fileKey does not have an extension at the end
			if strings.HasSuffix(fileKey, "guides.html") {
				fileKey = strings.TrimSuffix(fileKey, ".html")
			}

			if filepath.Ext(fileKey) == "" {
				fileKey = filepath.Join(fileKey, "index.html")
			}

			fileKey = fmt.Sprintf("rs|doc_%d|%s", docId, fileKey)
			value, err := db.GetValue([]byte(fileKey))
			if err == nil {
				// Set the appropriate Content-Type header
				contentType := getContentType(fileKey)
				w.Header().Set("Content-Type", contentType)
				w.Write(value)
				return
			}

			if _, err := os.Stat(fullPath); os.IsNotExist(err) {
				fullPath = filepath.Join(docPath, "build", "index.html")
			}
			http.ServeFile(w, r, fullPath)
		})
	}
}

// Helper function to determine the Content-Type based on file extension
func getContentType(filename string) string {
	ext := filepath.Ext(filename)
	switch strings.ToLower(ext) {
	case ".html", ".htm":
		return "text/html"
	case ".css":
		return "text/css"
	case ".js":
		return "application/javascript"
	case ".json":
		return "application/json"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	default:
		return "application/octet-stream"
	}
}
