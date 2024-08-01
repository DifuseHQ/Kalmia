package main

import (
	"embed"
	"fmt"
	"net/http"
	"os"
	"os/signal"

	"git.difuse.io/Difuse/kalmia/cmd"
	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/db"
	"git.difuse.io/Difuse/kalmia/handlers"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/middleware"
	"git.difuse.io/Difuse/kalmia/services"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

//go:embed embedded/docusaurus
var docusaurusFS embed.FS

func main() {
	cmd.AsciiArt()
	cfgPath := cmd.ParseFlags()
	cfg := config.ParseConfig(cfgPath)
	logger.InitializeLogger(cfg.Environment, cfg.LogLevel, cfg.DataPath)

	/* Setup database */
	d := db.SetupDatabase(cfg.Environment, cfg.DatabaseURL, cfg.DataPath)
	db.SetupBasicData(d, cfg.Admins)

	serviceRegistry := services.NewServiceRegistry(d)
	aS := serviceRegistry.AuthService
	dS := serviceRegistry.DocService

	/* Setup router */
	r := mux.NewRouter()

	/* Health endpoints */
	healthRouter := r.PathPrefix("/health").Subrouter()
	healthRouter.HandleFunc("/ping", handlers.HealthPing).Methods("GET")

	authRouter := r.PathPrefix("/auth").Subrouter()
	authRouter.Use(middleware.EnsureAuthenticated(aS))

	authRouter.HandleFunc("/user/create", func(w http.ResponseWriter, r *http.Request) { handlers.CreateUser(aS, w, r) }).Methods("POST")
	authRouter.HandleFunc("/user/edit", func(w http.ResponseWriter, r *http.Request) { handlers.EditUser(aS, w, r) }).Methods("POST")
	authRouter.HandleFunc("/user/delete", func(w http.ResponseWriter, r *http.Request) { handlers.DeleteUser(aS, w, r) }).Methods("POST")

	authRouter.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) { handlers.GetUsers(aS, w, r) }).Methods("GET")
	authRouter.HandleFunc("/user", func(w http.ResponseWriter, r *http.Request) { handlers.GetUser(aS, w, r) }).Methods("POST")
	authRouter.HandleFunc("/user/upload-photo", func(w http.ResponseWriter, r *http.Request) { handlers.UploadPhoto(d, w, r) }).Methods("POST")

	authRouter.HandleFunc("/jwt/create", func(w http.ResponseWriter, r *http.Request) { handlers.CreateJWT(aS, w, r) }).Methods("POST")
	authRouter.HandleFunc("/jwt/refresh", func(w http.ResponseWriter, r *http.Request) { handlers.RefreshJWT(aS, w, r) }).Methods("POST")
	authRouter.HandleFunc("/jwt/validate", func(w http.ResponseWriter, r *http.Request) { handlers.ValidateJWT(aS, w, r) }).Methods("POST")
	authRouter.HandleFunc("/jwt/revoke", func(w http.ResponseWriter, r *http.Request) { handlers.RevokeJWT(aS, w, r) }).Methods("POST")

	docsRouter := r.PathPrefix("/docs").Subrouter()
	docsRouter.Use(middleware.EnsureAuthenticated(aS))
	docsRouter.HandleFunc("/documentations", func(w http.ResponseWriter, r *http.Request) { handlers.GetDocumentations(dS, w, r) }).Methods("GET")
	docsRouter.HandleFunc("/documentation", func(w http.ResponseWriter, r *http.Request) { handlers.GetDocumentation(dS, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/documentation/create", func(w http.ResponseWriter, r *http.Request) { handlers.CreateDocumentation(serviceRegistry, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/documentation/edit", func(w http.ResponseWriter, r *http.Request) { handlers.EditDocumentation(serviceRegistry, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/documentation/delete", func(w http.ResponseWriter, r *http.Request) { handlers.DeleteDocumentation(dS, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/documentation/version", func(w http.ResponseWriter, r *http.Request) { handlers.CreateDocumentationVersion(dS, w, r) }).Methods("POST")

	docsRouter.HandleFunc("/pages", func(w http.ResponseWriter, r *http.Request) { handlers.GetPages(dS, w, r) }).Methods("GET")
	docsRouter.HandleFunc("/page", func(w http.ResponseWriter, r *http.Request) { handlers.GetPage(dS, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/page/create", func(w http.ResponseWriter, r *http.Request) { handlers.CreatePage(serviceRegistry, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/page/edit", func(w http.ResponseWriter, r *http.Request) { handlers.EditPage(serviceRegistry, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/page/reorder", func(w http.ResponseWriter, r *http.Request) { handlers.ReorderPage(dS, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/page/delete", func(w http.ResponseWriter, r *http.Request) { handlers.DeletePage(dS, w, r) }).Methods("POST")

	docsRouter.HandleFunc("/page-groups", func(w http.ResponseWriter, r *http.Request) { handlers.GetPageGroups(dS, w, r) }).Methods("GET")
	docsRouter.HandleFunc("/page-group", func(w http.ResponseWriter, r *http.Request) { handlers.GetPageGroup(dS, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/page-group/create", func(w http.ResponseWriter, r *http.Request) { handlers.CreatePageGroup(serviceRegistry, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/page-group/edit", func(w http.ResponseWriter, r *http.Request) { handlers.EditPageGroup(serviceRegistry, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/page-group/reorder", func(w http.ResponseWriter, r *http.Request) { handlers.ReorderPageGroup(dS, w, r) }).Methods("POST")
	docsRouter.HandleFunc("/page-group/delete", func(w http.ResponseWriter, r *http.Request) { handlers.DeletePageGroup(dS, w, r) }).Methods("POST")

	logger.Info("Starting server", zap.Int("port", cfg.Port))

	http.Handle("/", r)
	http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), middleware.CorsMiddleware(r))

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	<-c

	logger.Info("Shutting down server")
	os.Exit(0)
}
