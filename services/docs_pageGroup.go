package services

import (
	"errors"
	"fmt"

	"git.difuse.io/Difuse/kalmia/db/models"
	"gorm.io/gorm"
)

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
			"isPage":          page.IsPage,
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
		"isPageGroup":     group.IsPageGroup,
	}
}

func (service *DocService) recursiveFetchPageGroups(groupMap map[string]interface{}) {
	var childrenPageGroups []models.PageGroup
	service.DB.Model(&models.PageGroup{}).Where("parent_id = ?", groupMap["id"]).
		Preload("Pages").
		Preload("Pages.Author").
		Preload("Pages.Editors").
		Preload("Author").
		Preload("Editors").
		Find(&childrenPageGroups)

	childGroupMaps := make([]map[string]interface{}, 0, len(childrenPageGroups))
	for _, childGroup := range childrenPageGroups {
		childMap := convertPageGroupToMap(childGroup)
		service.recursiveFetchPageGroups(childMap)
		childGroupMaps = append(childGroupMaps, childMap)
	}

	if len(childGroupMaps) > 0 {
		groupMap["pageGroups"] = childGroupMaps
	}
}

func (service *DocService) GetPageGroups() ([]map[string]interface{}, error) {
	var pageGroups []models.PageGroup
	if err := service.DB.Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Title", "Slug", "PageGroupID", "Order", "DocumentationID", "CreatedAt", "UpdatedAt", "AuthorID", "LastEditorID", "IsPage")
	}).Preload("Pages.Author").
		Preload("Pages.Editors").
		Preload("Author").
		Preload("Editors").
		Select("ID", "Name", "DocumentationID", "ParentID", "Order", "CreatedAt", "UpdatedAt", "AuthorID", "LastEditorID", "IsPageGroup").
		Where("parent_id IS NULL").
		Find(&pageGroups).Error; err != nil {
		return nil, fmt.Errorf("failed_to_fetch_page_groups")
	}

	var finalPageGroups []map[string]interface{}
	for _, group := range pageGroups {
		groupMap := convertPageGroupToMap(group)
		service.recursiveFetchPageGroups(groupMap)
		finalPageGroups = append(finalPageGroups, groupMap)
	}

	return finalPageGroups, nil
}

func (service *DocService) GetPageGroup(id uint) (map[string]interface{}, error) {
	var pageGroup models.PageGroup
	if err := service.DB.Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Title", "Slug", "PageGroupID", "Order", "DocumentationID", "CreatedAt", "UpdatedAt", "AuthorID", "LastEditorID")
	}).Preload("Pages.Author").
		Preload("Pages.Editors").
		Preload("Author").
		Preload("Editors").
		First(&pageGroup, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("page_group_not_found")
		}
		return nil, fmt.Errorf("failed_to_fetch_page_group")
	}

	groupMap := convertPageGroupToMap(pageGroup)
	service.recursiveFetchPageGroups(groupMap)

	return groupMap, nil
}

func (service *DocService) CreatePageGroup(group *models.PageGroup) (uint, error) {
	if err := service.DB.Create(&group).Error; err != nil {
		return 0, fmt.Errorf("failed_to_create_page_group")
	}

	docId, err := service.GetDocumentationIDOfPageGroup(group.ID)
	if err != nil {
		return 0, fmt.Errorf("failed_to_get_documentation_id")
	}

	parentDocId, _ := service.GetRootParentID(docId)

	if parentDocId == 0 {
		err = service.AddBuildTrigger(docId)
	} else {
		err = service.AddBuildTrigger(parentDocId)
	}

	if err != nil {
		return 0, fmt.Errorf("failed_to_update_write_build")
	}

	return group.ID, nil
}
func (service *DocService) EditPageGroup(user models.User, id uint, name string, documentationID uint, parentID *uint, order *uint) error {
	var pageGroup models.PageGroup
	if err := service.DB.First(&pageGroup, id).Error; err != nil {
		return fmt.Errorf("page_group_not_found")
	}

	var docCount int64
	if err := service.DB.Model(&models.Documentation{}).Where("id = ?", documentationID).Count(&docCount).Error; err != nil {
		return fmt.Errorf("failed_to_verify_documentation")
	}
	if docCount == 0 {
		return fmt.Errorf("invalid_documentation_id")
	}

	if parentID != nil {
		if *parentID == pageGroup.ID {
			return fmt.Errorf("page_group_cannot_be_its_own_parent")
		}
		var parentCount int64
		if err := service.DB.Model(&models.PageGroup{}).Where("id = ?", parentID).Count(&parentCount).Error; err != nil {
			return fmt.Errorf("failed_to_verify_parent_page_group")
		}
		if parentCount == 0 {
			return fmt.Errorf("invalid_parent_page_group_id")
		}
	}

	pageGroup.Name = name
	pageGroup.DocumentationID = documentationID
	pageGroup.ParentID = parentID

	if order != nil {
		pageGroup.Order = order
	}

	pageGroup.LastEditorID = &user.ID

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

	if err := service.DB.Save(&pageGroup).Error; err != nil {
		return fmt.Errorf("failed_to_update_page_group")
	}

	docId, err := service.GetDocumentationIDOfPageGroup(id)

	if err != nil {
		return fmt.Errorf("failed_to_get_documentation_id")
	}

	parentDocId, _ := service.GetRootParentID(docId)

	if parentDocId == 0 {
		err = service.AddBuildTrigger(docId)
	} else {
		err = service.AddBuildTrigger(parentDocId)
	}

	if err != nil {
		return fmt.Errorf("failed_to_update_write_build")
	}

	return nil
}

func (service *DocService) deletePageGroupRecursive(tx *gorm.DB, id uint) error {
	var pageGroup models.PageGroup
	if err := tx.Preload("Pages").Preload("Editors").First(&pageGroup, id).Error; err != nil {
		return fmt.Errorf("page_group_not_found")
	}

	if err := tx.Model(&pageGroup).Association("Editors").Clear(); err != nil {
		return fmt.Errorf("failed_to_clear_editors: %v", err)
	}

	for _, page := range pageGroup.Pages {
		if err := tx.Model(&page).Association("Editors").Clear(); err != nil {
			return fmt.Errorf("failed_to_clear_page_editors: %v", err)
		}
	}

	if err := tx.Where("page_group_id = ?", id).Delete(&models.Page{}).Error; err != nil {
		return fmt.Errorf("failed_to_delete_associated_pages: %v", err)
	}

	var childGroups []models.PageGroup
	if err := tx.Where("parent_id = ?", id).Find(&childGroups).Error; err != nil {
		return fmt.Errorf("failed_to_find_child_page_groups: %v", err)
	}

	for _, childGroup := range childGroups {
		if err := service.deletePageGroupRecursive(tx, childGroup.ID); err != nil {
			return err
		}
	}

	if err := tx.Delete(&pageGroup).Error; err != nil {
		return fmt.Errorf("failed_to_delete_page_group: %v", err)
	}

	return nil
}

func (service *DocService) DeletePageGroup(id uint) error {
	var docId uint
	var err error

	err = service.DB.Transaction(func(tx *gorm.DB) error {
		docId, err = service.GetDocumentationIDOfPageGroup(id)
		if err != nil {
			return fmt.Errorf("failed_to_get_documentation_id: %v", err)
		}

		if err := service.deletePageGroupRecursive(tx, id); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return err
	}

	parentDocId, _ := service.GetRootParentID(docId)
	triggerDocId := docId
	if parentDocId != 0 {
		triggerDocId = parentDocId
	}

	if err := service.AddBuildTrigger(triggerDocId); err != nil {
		return fmt.Errorf("failed_to_update_write_build: %v", err)
	}

	return nil
}

func (service *DocService) GetDocumentationIDOfPageGroup(id uint) (uint, error) {
	var pageGroup models.PageGroup
	if err := service.DB.First(&pageGroup, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, fmt.Errorf("page_group_not_found")
		}
		return 0, fmt.Errorf("failed_to_fetch_page_group")
	}

	return pageGroup.DocumentationID, nil
}

func (service *DocService) ReorderPageGroup(id uint, order *uint, parentID *uint) error {
	var pageGroup models.PageGroup
	if err := service.DB.First(&pageGroup, id).Error; err != nil {
		return fmt.Errorf("failed_to_fetch_page_group")
	}

	pageGroup.Order = order
	pageGroup.ParentID = parentID

	if err := service.DB.Save(&pageGroup).Error; err != nil {
		return fmt.Errorf("failed_to_update_page_group")
	}

	docId, err := service.GetDocumentationIDOfPageGroup(id)

	if err != nil {
		return fmt.Errorf("failed_to_get_documentation_id")
	}

	parentDocId, _ := service.GetRootParentID(docId)

	if parentDocId == 0 {
		err = service.AddBuildTrigger(docId)
	} else {
		err = service.AddBuildTrigger(parentDocId)
	}

	if err != nil {
		return fmt.Errorf("failed_to_update_write_build")
	}

	return nil
}
