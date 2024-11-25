package handlers

import (
	"net/http"
	"path/filepath"
	"strconv"

	system "git.difuse.io/Difuse/kalmia/import-system/controlls"
	"git.difuse.io/Difuse/kalmia/services"
)

func ImportDocumentation(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Upload less than 10mb", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("MD-doc-zip")
	if err != nil {
		http.Error(w, "Error receving file", http.StatusBadRequest)
		return
	}

	if filepath.Ext(handler.Filename) != ".zip" {
		http.Error(w, "Only zip files are allowed", http.StatusBadRequest)
		return
	}
	err = system.ImportedDocumentationController(services, handler.Filename, file)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
}

func ImportMDFile(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request) {

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Upload less than 10mb", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("markdownfile")
	if err != nil {
		http.Error(w, "Error receving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if filepath.Ext(handler.Filename) != ".md" {
		http.Error(w, "Only mark-down files are allowed", http.StatusBadRequest)
		return
	}
	err = system.ImportedMDFileController(services, handler.Filename, file)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
}

func PostGitbook_URL(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request) {

	//Parsing doc_id from query parameters
	docIdstr := r.URL.Query().Get("doc_id")
	if docIdstr == "" {
		http.Error(w, "Missing 'doc_id' query parameter", http.StatusBadRequest)
		return
	}

	docId, err := strconv.Atoi(docIdstr)
	if err != nil {
		http.Error(w, "Invalid 'doc_id' parameter", http.StatusBadRequest)
		return
	}
}
