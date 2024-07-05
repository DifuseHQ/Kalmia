package handlers

import (
	"encoding/json"
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"gorm.io/gorm"
	"net/http"
)

func CreateDocumentation(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Name        string `json:"name" validate:"required"`
		Description string `json:"description"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err := validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	documentation := models.Documentation{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := db.Create(&documentation).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to create documentation", "reason": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Documentation created successfully"})
}

func GetDocumentations(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	var documentations []models.Documentation

	if err := db.Preload("PageGroups", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID")
	}).Preload("PageGroups.Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "PageGroupID")
	}).Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Title", "Slug").Where("page_group_id IS NULL")
	}).Select("ID", "Name", "Description", "CreatedAt", "UpdatedAt").Find(&documentations).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch documentations"})
		return
	}

	SendJSONResponse(http.StatusOK, w, documentations)
}

func GetDocumentation(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err := validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var documentation models.Documentation
	if err := db.Preload("PageGroups", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID")
	}).Preload("PageGroups.Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "PageGroupID")
	}).Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Title", "Slug").Where("page_group_id IS NULL")
	}).First(&documentation, req.ID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch documentation"})
		return
	}

	SendJSONResponse(http.StatusOK, w, documentation)
}

func EditDocumentation(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID          uint   `json:"id" validate:"required"`
		Name        string `json:"name" validate:"required"`
		Description string `json:"description" validate:"required"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err := validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var documentation models.Documentation
	if err := db.First(&documentation, req.ID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch documentation"})
		return
	}

	documentation.Name = req.Name
	documentation.Description = req.Description

	if err := db.Save(&documentation).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to update documentation"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Documentation updated successfully"})
}

func DeleteDocumentation(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request data"})
		return
	}

	err := validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	tx := db.Begin()
	if tx.Error != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to start transaction"})
		return
	}

	if err := tx.Where("documentation_id = ?", req.ID).Delete(&models.Page{}).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete pages"})
		return
	}

	if err := tx.Where("documentation_id = ?", req.ID).Delete(&models.PageGroup{}).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete page groups"})
		return
	}

	if err := tx.Where("id = ?", req.ID).Delete(&models.Documentation{}).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete documentation"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Transaction commit failed"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Documentation deleted successfully"})
}

func CreatePage(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Title           string `json:"title" validate:"required"`
		Slug            string `json:"slug" validate:"required"`
		Content         string `json:"content" validate:"required"`
		DocumentationID uint   `json:"documentationSiteId" validate:"required"`
		PageGroupID     *uint  `json:"pageGroupId"`
		Order           *uint  `json:"order"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err := validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	page := models.Page{
		Title:           req.Title,
		Slug:            req.Slug,
		Content:         req.Content,
		DocumentationID: req.DocumentationID,
	}

	if req.PageGroupID != nil {
		page.PageGroupID = req.PageGroupID
	}

	if req.Order != nil {
		page.Order = req.Order
	}

	if err := db.Create(&page).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to create page", "reason": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page created successfully"})
}

func GetPages(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	var pages []models.Page

	if err := db.Select("ID", "Title", "Slug", "DocumentationID", "PageGroupID", "Order").Find(&pages).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch pages"})
		return
	}

	SendJSONResponse(http.StatusOK, w, pages)
}

func GetPage(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err := validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var page models.Page
	if err := db.First(&page, req.ID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page"})
		return
	}

	SendJSONResponse(http.StatusOK, w, page)
}

func EditPage(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID      uint   `json:"id" validate:"required"`
		Title   string `json:"title" validate:"required"`
		Slug    string `json:"slug" validate:"required"`
		Content string `json:"content" validate:"required"`
		Order   *uint  `json:"order" default:"0"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var page models.Page
	if err := db.First(&page, req.ID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page"})
		return
	}

	page.Title = req.Title
	page.Slug = req.Slug
	page.Content = req.Content

	if req.Order != nil {
		page.Order = req.Order
	}

	if err := db.Save(&page).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to update page"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page updated successfully"})
}

func ReorderPage(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID          uint  `json:"id" validate:"required"`
		PageGroupID *uint `json:"pageGroupId"`
		Order       *uint `json:"order"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request data"})
		return
	}

	var page models.Page
	if err := db.First(&page, req.ID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page"})
		return
	}

	if req.PageGroupID != nil {
		page.PageGroupID = req.PageGroupID
	} else {
		page.PageGroupID = nil
	}

	if req.Order != nil {
		page.Order = req.Order
	}

	if err := db.Save(&page).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to update page"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page reordered successfully"})
}

func DeletePage(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request data"})
		return
	}

	err := validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	if err := db.Where("id = ?", req.ID).Delete(&models.Page{}).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete page"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page deleted successfully"})
}

func CreatePageGroup(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Name            string `json:"name" validate:"required"`
		DocumentationID uint   `json:"documentationSiteId" validate:"required"`
		ParentID        *uint  `json:"parentId"`
		Order           *uint  `json:"order"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	pageGroup := models.PageGroup{
		Name:            req.Name,
		DocumentationID: req.DocumentationID,
	}

	if req.ParentID != nil {
		pageGroup.ParentID = req.ParentID
	}

	if req.Order != nil {
		pageGroup.Order = req.Order
	}

	if err := db.Create(&pageGroup).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to create page group"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page group created successfully"})
}

func GetPageGroups(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	var pageGroups []models.PageGroup

	if err := db.Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Title", "Slug", "PageGroupID", "Order", "DocumentationID")
	}).Select("ID", "Name", "DocumentationID", "ParentID", "Order").Find(&pageGroups).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page groups"})
		return
	}

	groupsByID := make(map[uint]map[string]interface{})
	parentToChildren := make(map[uint][]map[string]interface{})

	for _, group := range pageGroups {
		simplifiedPages := make([]map[string]interface{}, 0, len(group.Pages))
		for _, page := range group.Pages {
			simplifiedPages = append(simplifiedPages, map[string]interface{}{
				"id":              page.ID,
				"title":           page.Title,
				"slug":            page.Slug,
				"pageGroupId":     page.PageGroupID,
				"order":           page.Order,
				"documentationId": page.DocumentationID,
			})
		}

		groupMap := map[string]interface{}{
			"id":              group.ID,
			"documentationId": group.DocumentationID,
			"name":            group.Name,
			"parentId":        group.ParentID,
			"order":           group.Order,
			"pages":           simplifiedPages,
		}

		groupsByID[group.ID] = groupMap
		if group.ParentID != nil {
			parentToChildren[*group.ParentID] = append(parentToChildren[*group.ParentID], groupMap)
		}
	}

	var finalPageGroups []interface{}
	for _, groupMap := range groupsByID {
		if children, exists := parentToChildren[groupMap["id"].(uint)]; exists {
			groupMap["pageGroups"] = children
		}
		finalPageGroups = append(finalPageGroups, groupMap)
	}

	SendJSONResponse(http.StatusOK, w, finalPageGroups)
}

func GetPageGroup(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err := validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var pageGroup models.PageGroup
	if err := db.Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "PageGroupID")
	}).First(&pageGroup, req.ID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page group"})
		return
	}

	SendJSONResponse(http.StatusOK, w, pageGroup)
}

func EditPageGroup(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID              uint   `json:"id" validate:"required"`
		Name            string `json:"name" validate:"required"`
		DocumentationID uint   `json:"documentationSiteId" validate:"required"`
		ParentID        *uint  `json:"parentId"`
		Order           *uint  `json:"order"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	var pageGroup models.PageGroup
	if err := db.First(&pageGroup, req.ID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page group"})
		return
	}

	pageGroup.Name = req.Name
	pageGroup.DocumentationID = req.DocumentationID

	if req.ParentID != nil {
		pageGroup.ParentID = req.ParentID
	}

	if req.Order != nil {
		pageGroup.Order = req.Order
	}

	if err := db.Save(&pageGroup).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to update page group"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page group updated successfully"})
}

func ReorderPageGroup(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID       uint  `json:"id" validate:"required"`
		Order    *uint `json:"order"`
		ParentID *uint `json:"parentId"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request data"})
		return
	}

	var pageGroup models.PageGroup
	if err := db.First(&pageGroup, req.ID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page group"})
		return
	}

	if req.Order != nil {
		pageGroup.Order = req.Order
	} else {
		pageGroup.Order = nil
	}

	if req.ParentID != nil {
		pageGroup.ParentID = req.ParentID
	} else {
		pageGroup.ParentID = nil
	}

	if err := db.Save(&pageGroup).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to update page group"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page group reordered successfully"})
}

func DeletePageGroup(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID uint `json:"id" validate:"required"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request data"})
		return
	}

	tx := db.Begin()
	if tx.Error != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to start transaction"})
		return
	}

	if err := tx.Where("page_group_id = ?", req.ID).Delete(&models.Page{}).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete pages"})
		return
	}

	if err := tx.Where("parent_id = ?", req.ID).Delete(&models.PageGroup{}).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete child page groups"})
		return
	}

	if err := tx.Where("id = ?", req.ID).Delete(&models.PageGroup{}).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete page group"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Transaction commit failed"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page group deleted successfully"})
}
