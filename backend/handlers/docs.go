package handlers

import (
	"net/http"

	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/services"
)

func GetDocumentations(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	docs, err := service.GetDocumentations()

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	SendJSONResponse(http.StatusOK, w, docs)
}

func GetDocumentation(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	doc, err := service.GetDocumentation(req.ID)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	SendJSONResponse(http.StatusOK, w, doc)
}

func CreateDocumentation(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request) {
	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_token"})
		return
	}

	user, err := services.AuthService.GetUserFromToken(token)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_token"})
		return
	}

	type Request struct {
		Name             string `json:"name" validate:"required"`
		Description      string `json:"description"`
		Version          string `json:"version" validate:"required"`
		Favicon          string `json:"favicon"`
		MetaImage        string `json:"metaImage"`
		NavImage         string `json:"navImage"`
		CustomCSS        string `json:"customCSS"`
		FooterLabelLinks string `json:"footerLabelLinks"`
		MoreLabelLinks   string `json:"moreLabelLinks"`
		CopyrightText    string `json:"copyrightText"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	documentation := &models.Documentation{
		Name:             req.Name,
		Description:      req.Description,
		AuthorID:         user.ID,
		Author:           user,
		Editors:          []models.User{user},
		LastEditorID:     &user.ID,
		Version:          req.Version,
		Favicon:          req.Favicon,
		MetaImage:        req.MetaImage,
		NavImage:         req.NavImage,
		CustomCSS:        req.CustomCSS,
		FooterLabelLinks: req.FooterLabelLinks,
		MoreLabelLinks:   req.MoreLabelLinks,
		CopyrightText:    req.CopyrightText,
	}

	err = services.DocService.CreateDocumentation(documentation, user)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "documentation_created"})
}

func EditDocumentation(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID               uint   `json:"id" validate:"required"`
		Name             string `json:"name" validate:"required"`
		Description      string `json:"description" validate:"required"`
		Version          string `json:"version"`
		Favicon          string `json:"favicon"`
		MetaImage        string `json:"metaImage"`
		NavImage         string `json:"navImage"`
		CustomCSS        string `json:"customCSS"`
		FooterLabelLinks string `json:"footerLabelLinks"`
		MoreLabelLinks   string `json:"moreLabelLinks"`
		CopyrightText    string `json:"copyrightText"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	token, err := GetTokenFromHeader(r)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	user, err := services.AuthService.GetUserFromToken(token)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	err = services.DocService.EditDocumentation(user, req.ID, req.Name, req.Description, req.Version, req.Favicon, req.MetaImage, req.NavImage, req.CustomCSS, req.FooterLabelLinks, req.MoreLabelLinks, req.CopyrightText)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "documentation_updated"})
}

func DeleteDocumentation(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	err = service.DeleteDocumentation(req.ID)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "documentation_deleted"})
}

func CreateDocumentationVersion(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		OriginalDocID uint   `json:"originalDocId" validate:"required"`
		NewVersion    string `json:"version" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	err = service.CreateDocumentationVersion(req.OriginalDocID, req.NewVersion)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "version_created"})
}

func GetPages(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	pages, err := service.GetPages()

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, pages)
}

func GetPage(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	page, err := service.GetPage(req.ID)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, page)
}

func CreatePage(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Title           string `json:"title" validate:"required"`
		Slug            string `json:"slug" validate:"required"`
		Content         string `json:"content" validate:"required"`
		DocumentationID uint   `json:"documentationId" validate:"required"`
		PageGroupID     *uint  `json:"pageGroupId"`
		Order           *uint  `json:"order"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	user, err := services.AuthService.GetUserFromToken(token)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	page := models.Page{
		Title:           req.Title,
		Slug:            req.Slug,
		Content:         req.Content,
		DocumentationID: req.DocumentationID,
		AuthorID:        user.ID,
		Author:          user,
		Editors:         []models.User{user},
		LastEditorID:    &user.ID,
	}

	if req.PageGroupID != nil {
		page.PageGroupID = req.PageGroupID
	}

	if req.Order != nil {
		page.Order = req.Order
	}

	err = services.DocService.CreatePage(&page)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "page_created"})
}

func EditPage(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID      uint   `json:"id" validate:"required"`
		Title   string `json:"title" validate:"required"`
		Slug    string `json:"slug" validate:"required"`
		Content string `json:"content" validate:"required"`
		Order   *uint  `json:"order"`
	}

	req, err := ValidateRequest[Request](w, r)
	if err != nil {
		return
	}

	token, err := GetTokenFromHeader(r)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	user, err := services.AuthService.GetUserFromToken(token)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	err = services.DocService.EditPage(user, req.ID, req.Title, req.Slug, req.Content, req.Order)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "page_updated"})
}

func DeletePage(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)
	if err != nil {
		return
	}

	err = service.DeletePage(req.ID)
	if err != nil {
		switch err.Error() {
		case "page_not_found":
			SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Page not found"})
		default:
			logger.Error(err.Error())
			SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		}
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "page_deleted"})
}

func ReorderPage(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID          uint  `json:"id" validate:"required"`
		PageGroupID *uint `json:"pageGroupId"`
		Order       *uint `json:"order"`
	}

	req, err := ValidateRequest[Request](w, r)
	if err != nil {
		return
	}

	err = service.ReorderPage(req.ID, req.PageGroupID, req.Order)
	if err != nil {
		switch err.Error() {
		case "page_not_found":
			SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Page not found"})
		default:
			logger.Error(err.Error())
			SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		}
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "page_reordered"})
}

func GetPageGroups(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	pageGroups, err := service.GetPageGroups()
	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, pageGroups)
}

func GetPageGroup(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)
	if err != nil {
		return
	}

	pageGroup, err := service.GetPageGroup(req.ID)
	if err != nil {
		switch err.Error() {
		case "page_group_not_found":
			SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Page group not found"})
		default:
			logger.Error(err.Error())
			SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		}
		return
	}

	SendJSONResponse(http.StatusOK, w, pageGroup)
}

func CreatePageGroup(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Name            string `json:"name" validate:"required"`
		DocumentationID uint   `json:"documentationId" validate:"required"`
		ParentID        *uint  `json:"parentId"`
		Order           *uint  `json:"order"`
	}

	req, err := ValidateRequest[Request](w, r)

	if err != nil {
		return
	}

	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	user, err := services.AuthService.GetUserFromToken(token)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	pageGroup := models.PageGroup{
		Name:            req.Name,
		DocumentationID: req.DocumentationID,
		AuthorID:        user.ID,
		Author:          user,
		Editors:         []models.User{user},
		LastEditorID:    &user.ID,
	}

	if req.ParentID != nil {
		pageGroup.ParentID = req.ParentID
	}

	if req.Order != nil {
		pageGroup.Order = req.Order
	}

	err = services.DocService.CreatePageGroup(&pageGroup)

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "page_group_created"})
}

func EditPageGroup(services *services.ServiceRegistry, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID              uint   `json:"id" validate:"required"`
		Name            string `json:"name" validate:"required"`
		DocumentationID uint   `json:"documentationId" validate:"required"`
		ParentID        *uint  `json:"parentId"`
		Order           *uint  `json:"order"`
	}

	req, err := ValidateRequest[Request](w, r)
	if err != nil {
		return
	}

	token, err := GetTokenFromHeader(r)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	user, err := services.AuthService.GetUserFromToken(token)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "invalid_request"})
		return
	}

	err = services.DocService.EditPageGroup(user, req.ID, req.Name, req.DocumentationID, req.ParentID, req.Order)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "page_group_updated"})
}

func DeletePageGroup(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	req, err := ValidateRequest[Request](w, r)
	if err != nil {
		return
	}

	err = service.DeletePageGroup(req.ID)
	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "page_group_deleted"})
}

func ReorderPageGroup(service *services.DocService, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID       uint  `json:"id" validate:"required"`
		Order    *uint `json:"order"`
		ParentID *uint `json:"parentId"`
	}

	req, err := ValidateRequest[Request](w, r)
	if err != nil {
		return
	}

	err = service.ReorderPageGroup(req.ID, req.Order, req.ParentID)
	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "page_group_reordered"})
}
