package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/services"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func GetDocumentations(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	var documentations []models.Documentation

	if err := db.Preload("Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Name", "CreatedAt", "UpdatedAt", "AuthorID", "Order")
	}).Preload("PageGroups.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Preload("PageGroups.Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "PageGroupID", "Title", "Slug", "CreatedAt", "UpdatedAt", "AuthorID", "Order")
	}).Preload("PageGroups.Pages.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups.Pages.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Title", "Slug", "CreatedAt", "UpdatedAt", "AuthorID", "Order").Where("page_group_id IS NULL")
	}).Preload("Pages.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Pages.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Select("ID", "Name", "Description", "CreatedAt", "UpdatedAt", "AuthorID", "Version", "ClonedFrom", "LastEditorID", "Favicon", "MetaImage", "NavImage", "CustomCSS", "FooterLabelLinks", "MoreLabelLinks").
		Find(&documentations).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{
			"status":  "error",
			"message": "Failed to fetch documentations",
		})
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
	if err := db.Preload("Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Name", "CreatedAt", "UpdatedAt", "AuthorID")
	}).Preload("PageGroups.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Preload("PageGroups.Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "PageGroupID", "Title", "Slug", "CreatedAt", "UpdatedAt", "AuthorID")
	}).Preload("PageGroups.Pages.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups.Pages.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Title", "Slug", "CreatedAt", "UpdatedAt", "AuthorID").Where("page_group_id IS NULL")
	}).Preload("Pages.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Pages.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Where("id = ?", req.ID).Select("ID", "Name", "Description", "CreatedAt", "UpdatedAt", "AuthorID", "Version", "LastEditorID", "Favicon", "MetaImage", "NavImage", "CustomCSS", "FooterLabelLinks", "MoreLabelLinks", "CopyrightText").
		Find(&documentation).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{
			"status":  "error",
			"message": "Failed to fetch documentations",
		})
		return
	}

	SendJSONResponse(http.StatusOK, w, documentation)
}

func CreateDocumentation(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
		return
	}

	user, err := services.GetUserFromToken(db, token)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
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

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	err = validate.Struct(req)

	if err != nil {
		logger.Error(err.Error())
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request"})
		return
	}

	documentation := models.Documentation{
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

	if err := db.Create(&documentation).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to create documentation", "reason": err.Error()})
		return
	}

	introPage := models.Page{
		Title:           "Introduction",
		Slug:            "/",
		Content:         `[{"id":"fa01e096-3187-4628-8f1e-77728cee3aa6","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"Welcome to the difuse documentation!","styles":{}}],"children":[]},{"id":"90f28c74-6195-4074-8861-35b82b9bfb1c","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]`,
		DocumentationID: documentation.ID,
		AuthorID:        user.ID,
		Author:          user,
		Editors:         []models.User{user},
		LastEditorID:    &user.ID,
	}

	if err := db.Create(&introPage).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to create documentation", "reason": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Documentation created successfully"})

	go func() {
		err := services.InitDocusaurus(db, documentation.ID)
		if err != nil {
			logger.Error("Failed to initialize docsaurus for documentation", zap.Error(err))
		}
	}()
}

func EditDocumentation(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
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
	if err := db.Preload("Editors").First(&documentation, req.ID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch documentation"})
		return
	}

	token, err := GetTokenFromHeader(r)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
		return
	}

	user, err := services.GetUserFromToken(db, token)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
		return
	}

	alreadyEditor := false
	for _, editor := range documentation.Editors {
		if editor.ID == user.ID {
			alreadyEditor = true
			break
		}
	}

	if !alreadyEditor {
		documentation.Editors = append(documentation.Editors, user)
	}

	documentation.LastEditorID = &user.ID

	documentation.Name = req.Name
	documentation.Description = req.Description

	if req.Version != "" {
		documentation.Version = req.Version
	}

	if req.Favicon != "" {
		documentation.Favicon = req.Favicon
	}

	if req.MetaImage != "" {
		documentation.MetaImage = req.MetaImage
	}

	if req.NavImage != "" {
		documentation.NavImage = req.NavImage
	}

	if req.CustomCSS != "" {
		documentation.CustomCSS = req.CustomCSS
	}

	if req.FooterLabelLinks != "" {
		documentation.FooterLabelLinks = req.FooterLabelLinks
	}

	if req.MoreLabelLinks != "" {
		documentation.MoreLabelLinks = req.MoreLabelLinks
	}

	if req.CopyrightText != "" {
		documentation.CopyrightText = req.CopyrightText
	}

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

	var doc models.Documentation
	if err := tx.Preload("PageGroups").Preload("Pages").First(&doc, req.ID).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Documentation not found"})
		return
	}

	associations := []string{"PageGroups", "Pages", "Editors"}
	for _, assoc := range associations {
		if err := tx.Model(&doc).Association(assoc).Clear(); err != nil {
			tx.Rollback()
			SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": fmt.Sprintf("Failed to clear %s", assoc)})
			return
		}
	}

	if err := tx.Delete(&doc).Error; err != nil {
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

func CreateDocumentationVersion(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		OriginalDocID uint   `json:"originalDocId" validate:"required"`
		NewVersion    string `json:"version" validate:"required"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid request data"})
		return
	}

	var originalDoc models.Documentation
	if err := db.Preload("PageGroups.Pages").Preload("Pages").First(&originalDoc, req.OriginalDocID).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch documentation"})
		return
	}

	newDoc := models.Documentation{
		Name:        originalDoc.Name,
		Description: originalDoc.Description,
		Version:     req.NewVersion,
		AuthorID:    originalDoc.AuthorID,
		ClonedFrom:  &req.OriginalDocID,
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&newDoc).Error; err != nil {
			return fmt.Errorf("failed to create new doc: %w", err)
		}

		for _, editor := range originalDoc.Editors {
			if err := tx.Model(&newDoc).Association("Editors").Append(&editor); err != nil {
				return fmt.Errorf("failed to append editor: %w", err)
			}
		}

		pageGroupMap := make(map[uint]uint)
		for _, pg := range originalDoc.PageGroups {
			newPG := models.PageGroup{
				DocumentationID: newDoc.ID,
				ParentID:        pg.ParentID,
				AuthorID:        pg.AuthorID,
				Name:            pg.Name,
				Order:           pg.Order,
			}

			if err := tx.Create(&newPG).Error; err != nil {
				return fmt.Errorf("failed to create new page group: %w", err)
			}

			pageGroupMap[pg.ID] = newPG.ID

			for _, editor := range pg.Editors {
				if err := tx.Model(&newPG).Association("Editors").Append(&editor); err != nil {
					return fmt.Errorf("failed to append editor to page group: %w", err)
				}
			}

			for _, page := range pg.Pages {
				newPage := models.Page{
					DocumentationID: newDoc.ID,
					PageGroupID:     &newPG.ID,
					AuthorID:        page.AuthorID,
					Title:           page.Title,
					Slug:            page.Slug,
					Content:         page.Content,
					Order:           page.Order,
				}

				if err := tx.Create(&newPage).Error; err != nil {
					return fmt.Errorf("failed to create new page: %w", err)
				}

				for _, editor := range page.Editors {
					if err := tx.Model(&newPage).Association("Editors").Append(&editor); err != nil {
						return fmt.Errorf("failed to append editor to page: %w", err)
					}
				}
			}
		}

		for oldID, newID := range pageGroupMap {
			var originalPageGroup *models.PageGroup
			for _, pg := range originalDoc.PageGroups {
				if pg.ID == oldID {
					originalPageGroup = &pg
					break
				}
			}
			if originalPageGroup == nil {
				return fmt.Errorf("original page group not found for ID: %d", oldID)
			}

			if originalPageGroup.ParentID != nil {
				parentID, ok := pageGroupMap[*originalPageGroup.ParentID]
				if !ok {
					return fmt.Errorf("parent page group not found for ID: %d", *originalPageGroup.ParentID)
				}
				if err := tx.Model(&models.PageGroup{}).Where("id = ?", newID).
					Update("parent_id", parentID).Error; err != nil {
					return fmt.Errorf("failed to update parent ID: %w", err)
				}
			}
		}

		for _, page := range originalDoc.Pages {
			if page.PageGroupID == nil {
				newPage := models.Page{
					DocumentationID: newDoc.ID,
					AuthorID:        page.AuthorID,
					Title:           page.Title,
					Slug:            page.Slug,
					Content:         page.Content,
					Order:           page.Order,
				}

				if err := tx.Create(&newPage).Error; err != nil {
					return fmt.Errorf("failed to create new page without group: %w", err)
				}

				for _, editor := range page.Editors {
					if err := tx.Model(&newPage).Association("Editors").Append(&editor); err != nil {
						return fmt.Errorf("failed to append editor to page without group: %w", err)
					}
				}
			}
		}

		return nil
	})

	if err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to version documentation"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": fmt.Sprintf("Documentation version %s created", req.NewVersion)})
}

func GetPages(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	var pages []models.Page

	if err := db.Preload("Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Select("ID", "Title", "Slug", "DocumentationID", "PageGroupID", "Order", "CreatedAt", "UpdatedAt", "AuthorID", "LastEditorID").
		Find(&pages).Error; err != nil {
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
	if err := db.Preload("Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).First(&page, req.ID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Page not found"})
		} else {
			SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page"})
		}
		return
	}

	SendJSONResponse(http.StatusOK, w, page)
}

func CreatePage(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Title           string `json:"title" validate:"required"`
		Slug            string `json:"slug" validate:"required"`
		Content         string `json:"content" validate:"required"`
		DocumentationID uint   `json:"documentationId" validate:"required"`
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

	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
		return
	}

	user, err := services.GetUserFromToken(db, token)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
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

	if err := db.Create(&page).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to create page", "reason": err.Error()})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page created successfully"})
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

	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
		return
	}

	user, err := services.GetUserFromToken(db, token)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
		return
	}

	alreadyEditor := false
	for _, editor := range page.Editors {
		if editor.ID == user.ID {
			alreadyEditor = true
			break
		}
	}

	if !alreadyEditor {
		page.Editors = append(page.Editors, user)
	}

	page.Title = req.Title
	page.Slug = req.Slug
	page.Content = req.Content
	page.LastEditorID = &user.ID

	if req.Order != nil {
		page.Order = req.Order
	}

	if err := db.Save(&page).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to update page"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page updated successfully"})
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

	tx := db.Begin()
	if tx.Error != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to start transaction"})
		return
	}

	var page models.Page
	if err := tx.First(&page, req.ID).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Page not found"})
		} else {
			SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page"})
		}
		return
	}

	if err := tx.Model(&page).Association("Editors").Clear(); err != nil {
		tx.Rollback()
		logger.Error(fmt.Sprintf("Error clearing Editors association: %v", err))
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to clear page associations"})
		return
	}

	if err := tx.Delete(&page).Error; err != nil {
		tx.Rollback()
		logger.Error(fmt.Sprintf("Error deleting Page: %v", err))
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete page"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Transaction commit failed"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page deleted successfully"})
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

func convertPageGroupToMap(group models.PageGroup) map[string]interface{} {
	simplifiedPages := make([]map[string]interface{}, 0, len(group.Pages))
	for _, page := range group.Pages {
		simplifiedAuthors := map[string]interface{}{
			"id":       page.Author.ID,
			"username": page.Author.Username,
			"email":    page.Author.Email,
		}
		if page.Author.Photo != "" {
			simplifiedAuthors["photo"] = page.Author.Photo
		}

		simplifiedEditors := make([]map[string]interface{}, 0, len(page.Editors))
		for _, editor := range page.Editors {
			editorMap := map[string]interface{}{
				"id":       editor.ID,
				"username": editor.Username,
				"email":    editor.Email,
			}
			if editor.Photo != "" {
				editorMap["photo"] = editor.Photo
			}
			simplifiedEditors = append(simplifiedEditors, editorMap)
		}

		simplifiedPages = append(simplifiedPages, map[string]interface{}{
			"id":              page.ID,
			"title":           page.Title,
			"slug":            page.Slug,
			"pageGroupId":     page.PageGroupID,
			"order":           page.Order,
			"documentationId": page.DocumentationID,
			"createdAt":       page.CreatedAt,
			"updatedAt":       page.UpdatedAt,
			"author":          simplifiedAuthors,
			"editors":         simplifiedEditors,
			"lastEditorId":    page.LastEditorID,
		})
	}

	simplifiedAuthors := map[string]interface{}{
		"id":       group.Author.ID,
		"username": group.Author.Username,
		"email":    group.Author.Email,
	}
	if group.Author.Photo != "" {
		simplifiedAuthors["photo"] = group.Author.Photo
	}

	simplifiedEditors := make([]map[string]interface{}, 0, len(group.Editors))
	for _, editor := range group.Editors {
		editorMap := map[string]interface{}{
			"id":       editor.ID,
			"username": editor.Username,
			"email":    editor.Email,
		}
		if editor.Photo != "" {
			editorMap["photo"] = editor.Photo
		}
		simplifiedEditors = append(simplifiedEditors, editorMap)
	}

	return map[string]interface{}{
		"id":              group.ID,
		"documentationId": group.DocumentationID,
		"name":            group.Name,
		"parentId":        group.ParentID,
		"order":           group.Order,
		"createdAt":       group.CreatedAt,
		"updatedAt":       group.UpdatedAt,
		"pages":           simplifiedPages,
		"author":          simplifiedAuthors,
		"editors":         simplifiedEditors,
		"lastEditorId":    group.LastEditorID,
	}
}

func recursiveFetchPageGroups(db *gorm.DB, groupMap map[string]interface{}) {
	var childrenPageGroups []models.PageGroup
	db.Model(&models.PageGroup{}).Where("parent_id = ?", groupMap["id"]).
		Preload("Pages").
		Preload("Pages.Author").
		Preload("Pages.Editors").
		Preload("Author").
		Preload("Editors").
		Find(&childrenPageGroups)

	childGroupMaps := make([]map[string]interface{}, 0, len(childrenPageGroups))
	for _, childGroup := range childrenPageGroups {
		childMap := convertPageGroupToMap(childGroup)
		recursiveFetchPageGroups(db, childMap)
		childGroupMaps = append(childGroupMaps, childMap)
	}

	if len(childGroupMaps) > 0 {
		groupMap["pageGroups"] = childGroupMaps
	}
}

func GetPageGroups(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	var pageGroups []models.PageGroup

	if err := db.Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Title", "Slug", "PageGroupID", "Order", "DocumentationID", "CreatedAt", "UpdatedAt", "AuthorID", "LastEditorID")
	}).Preload("Pages.Author").
		Preload("Pages.Editors").
		Preload("Author").
		Preload("Editors").
		Select("ID", "Name", "DocumentationID", "ParentID", "Order", "CreatedAt", "UpdatedAt", "AuthorID", "LastEditorID").
		Where("parent_id IS NULL").
		Find(&pageGroups).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page groups"})
		return
	}

	var finalPageGroups []interface{}
	for _, group := range pageGroups {
		groupMap := convertPageGroupToMap(group)
		recursiveFetchPageGroups(db, groupMap)
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
		return db.Select("ID", "Title", "Slug", "PageGroupID", "Order", "DocumentationID", "CreatedAt", "UpdatedAt", "AuthorID", "LastEditorID")
	}).Preload("Pages.Author").
		Preload("Pages.Editors").
		Preload("Author").
		Preload("Editors").
		First(&pageGroup, req.ID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Page group not found"})
		} else {
			SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to fetch page group"})
		}
		return
	}

	groupMap := convertPageGroupToMap(pageGroup)
	recursiveFetchPageGroups(db, groupMap)

	SendJSONResponse(http.StatusOK, w, groupMap)
}

func CreatePageGroup(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Name            string `json:"name" validate:"required"`
		DocumentationID uint   `json:"documentationId" validate:"required"`
		ParentID        *uint  `json:"parentId"`
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

	token, err := GetTokenFromHeader(r)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
		return
	}

	user, err := services.GetUserFromToken(db, token)

	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
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

	if err := db.Create(&pageGroup).Error; err != nil {
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to create page group"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page group created successfully"})
}

func EditPageGroup(db *gorm.DB, w http.ResponseWriter, r *http.Request) {
	type Request struct {
		ID              uint   `json:"id" validate:"required"`
		Name            string `json:"name" validate:"required"`
		DocumentationID uint   `json:"documentationId" validate:"required"`
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

	token, err := GetTokenFromHeader(r)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
		return
	}

	user, err := services.GetUserFromToken(db, token)
	if err != nil {
		SendJSONResponse(http.StatusUnauthorized, w, map[string]string{"status": "error", "message": "Unauthorized"})
		return
	}

	alreadyEditor := false
	for _, editor := range pageGroup.Editors {
		if editor.ID == user.ID {
			alreadyEditor = true
			break
		}
	}

	if !alreadyEditor {
		pageGroup.Editors = append(pageGroup.Editors, user)
	}

	pageGroup.LastEditorID = &user.ID
	pageGroup.Name = req.Name

	if pageGroup.DocumentationID != req.DocumentationID {
		var docCount int64
		if err := db.Model(&models.Documentation{}).Where("id = ?", req.DocumentationID).Count(&docCount).Error; err != nil {
			SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to verify documentation"})
			return
		}
		if docCount == 0 {
			SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid documentation ID"})
			return
		}
		pageGroup.DocumentationID = req.DocumentationID
	}

	if req.ParentID != nil {
		if *req.ParentID != pageGroup.ID {
			var parentCount int64
			if err := db.Model(&models.PageGroup{}).Where("id = ?", req.ParentID).Count(&parentCount).Error; err != nil {
				SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to verify parent page group"})
				return
			}
			if parentCount == 0 {
				SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Invalid parent page group ID"})
				return
			}
			pageGroup.ParentID = req.ParentID
		} else {
			SendJSONResponse(http.StatusBadRequest, w, map[string]string{"status": "error", "message": "Page group cannot be its own parent"})
			return
		}
	} else {
		pageGroup.ParentID = nil
	}

	if req.Order != nil {
		pageGroup.Order = req.Order
	}

	if err := db.Save(&pageGroup).Error; err != nil {
		fmt.Println(err)
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to update page group"})
		return
	}

	SendJSONResponse(http.StatusOK, w, map[string]string{"status": "success", "message": "Page group updated successfully"})
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

	var pageGroup models.PageGroup
	if err := tx.Preload("Pages").Preload("Editors").First(&pageGroup, req.ID).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusNotFound, w, map[string]string{"status": "error", "message": "Page group not found"})
		return
	}

	if err := tx.Model(&pageGroup).Association("Editors").Clear(); err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to clear Editors"})
		return
	}

	if err := tx.Where("page_group_id = ?", req.ID).Delete(&models.Page{}).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete associated pages"})
		return
	}

	if err := tx.Where("parent_id = ?", req.ID).Delete(&models.PageGroup{}).Error; err != nil {
		tx.Rollback()
		SendJSONResponse(http.StatusInternalServerError, w, map[string]string{"status": "error", "message": "Failed to delete child page groups"})
		return
	}

	if err := tx.Delete(&pageGroup).Error; err != nil {
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
