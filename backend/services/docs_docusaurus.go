package services

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"go.uber.org/zap"
)

type Block struct {
	Type     string                 `json:"type"`
	Props    map[string]interface{} `json:"props"`
	Content  interface{}            `json:"content"`
	Children []Block                `json:"children"`
}

func copyInitFiles(to string) error {
	toCopy := []string{
		"src/",
		"static/",
		"babel.config.js",
		"package.json",
		"sidebars.js",
		"docusaurus.config.js",
	}

	for _, file := range toCopy {
		if strings.HasSuffix(file, "/") {
			err := utils.CopyEmbeddedFolder(file, filepath.Join(to, file))
			if err != nil {
				return fmt.Errorf("failed to copy folder %s: %w", file, err)
			}
		} else {
			err := utils.CopyEmbeddedFile(file, filepath.Join(to, file))
			if err != nil {
				return fmt.Errorf("failed to copy file %s: %w", file, err)
			}
		}
	}

	return nil
}

func (service *DocService) StartupCheck() error {
	npmPinged := utils.NpmPing()

	if !npmPinged {
		logger.Panic("Startup check failed for NPM, exiting...")
	}

	db := service.DB
	var docs []models.Documentation

	if err := db.Find(&docs).Error; err != nil {
		return err
	}

	for _, doc := range docs {
		if doc.ClonedFrom == nil {
			allDocsPath := filepath.Join(config.ParsedConfig.DataPath, "docusaurus_data")
			docsPath := filepath.Join(allDocsPath, "doc_"+strconv.Itoa(int(doc.ID)))

			if !utils.PathExists(docsPath) {
				if err := service.InitDocusaurus(doc.ID); err != nil {
					return err
				}

				logger.Info("Document initialized -> ", zap.Uint("doc_id", doc.ID))
			} else {
				if err := utils.RunNpmCommand(docsPath, "install", "--prefer-offline", "--no-audit", "--progress=false", "--no-fund"); err != nil {
					removeErr := utils.RemovePath(docsPath)
					if removeErr != nil {
						return fmt.Errorf("failed to remove path %s: %w", docsPath, removeErr)
					}

					if err := service.InitDocusaurus(doc.ID); err != nil {
						return err
					}
				}
			}
		}

		err := service.UpdateBasicData(doc.ID)

		if err != nil {
			fmt.Println(err)
			return err
		}

		err = service.WriteContents(doc.ID)

		if err != nil {
			fmt.Println(err)
			return err
		}
	}

	return nil
}

func (service *DocService) InitDocusaurus(docId uint) error {
	cfg := config.ParsedConfig
	allDocsPath := filepath.Join(cfg.DataPath, "docusaurus_data")
	docsPath := filepath.Join(allDocsPath, "doc_"+strconv.Itoa(int(docId)))

	err := copyInitFiles(docsPath)

	if err != nil {
		return err
	}

	npmPing := utils.NpmPing()

	if !npmPing {
		return fmt.Errorf("NPM ping failed for %d initialization", docId)
	}

	if err := utils.RunNpmCommand(docsPath, "install", "--prefer-offline", "--no-audit", "--progress=false", "--no-fund"); err != nil {
		return err
	}

	return nil
}

func (service *DocService) UpdateBasicData(docId uint) error {
	doc, err := service.GetDocumentation(docId)
	if err != nil {
		return err
	}

	docPath := filepath.Join(config.ParsedConfig.DataPath, "docusaurus_data", "doc_"+strconv.Itoa(int(docId)))
	docConfig := filepath.Join(docPath, "docusaurus.config.js")
	docCssConfig := filepath.Join(docPath, "src/css/custom.css")

	replacements := map[string]string{
		"__TITLE__":          doc.Name,
		"__TAG_LINE__":       doc.Description,
		"__FAVICON__":        "img/favicon.ico",
		"__META_IMAGE__":     "img/meta.webp",
		"__NAVBAR_LOGO__":    "img/navbar.webp",
		"__COPYRIGHT_TEXT__": "Iridia Solutions Pvt. Ltd. Built With Kalmia",
		"__URL__":            "http://localhost:3000",
	}

	if doc.Favicon != "" {
		replacements["__FAVICON__"] = doc.Favicon
	}

	if doc.MetaImage != "" {
		replacements["__META_IMAGE__"] = doc.MetaImage
	}

	if doc.NavImage != "" {
		replacements["__NAVBAR_LOGO__"] = doc.NavImage
	}

	if doc.CopyrightText != "" {
		replacements["__COPYRIGHT_TEXT__"] = doc.CopyrightText + ", Built With Kalmia."
	}

	if doc.CustomCSS != "" {
		err := utils.ReplaceInFile(docCssConfig, "__CUSTOM_CSS__", doc.CustomCSS)
		if err != nil {
			return err
		}
	} else {
		err := utils.ReplaceInFile(docCssConfig, "__CUSTOM_CSS__", "")
		if err != nil {
			return err
		}
	}

	if doc.MoreLabelLinks != "" {
		moreLabelLinks := strings.ReplaceAll(doc.MoreLabelLinks, "community", "href")
		replacements["__MORE_LABEL_HREF__"] = moreLabelLinks
	} else {
		replacements["__MORE_LABEL_HREF__"] = ""
	}

	if doc.FooterLabelLinks != "" {
		footerLabelLinks := strings.ReplaceAll(doc.FooterLabelLinks, "community", "href")
		replacements["__COMMUNITY_LABEL_HREF__"] = footerLabelLinks
	} else {
		replacements["__COMMUNITY_LABEL_HREF__"] = ""
	}

	return utils.ReplaceManyInFile(docConfig, replacements)
}

func CraftPage(position uint, title string, slug string, content string) (string, error) {
	var blocks []Block
	err := json.Unmarshal([]byte(content), &blocks)
	if err != nil {
		return "", err
	}

	markdown := ""
	for _, block := range blocks {
		markdown += blockToMarkdown(block, 0, nil)
	}

	return fmt.Sprintf("---\nsidebar_position: %d\ntitle: %s\nslug: %s\n---\n\n%s", position, title, slug, markdown), nil
}

func blockToMarkdown(block Block, depth int, numbering *[]int) string {
	content := getTextContent(block.Content)
	styledContent := applyBlockStyles(content, block.Props)

	switch block.Type {
	case "heading":
		level, _ := block.Props["level"].(float64)
		return fmt.Sprintf("%s %s\n\n", strings.Repeat("#", int(level)), styledContent)
	case "paragraph":
		return paragraphToMarkdown(styledContent)
	case "numberedListItem":
		return numberedListItemToMarkdown(block, depth, numbering, styledContent)
	case "bulletListItem":
		return bulletListItemToMarkdown(block, depth, styledContent)
	case "checkListItem":
		return checkListItemToMarkdown(block, depth, styledContent)
	default:
		return ""
	}
}

func numberedListItemToMarkdown(block Block, depth int, numbering *[]int, content string) string {
	if numbering == nil {
		numbering = &[]int{0}
	}

	if len(*numbering) < depth+1 {
		*numbering = append(*numbering, 1)
	} else {
		(*numbering)[depth]++
	}

	indent := strings.Repeat("    ", depth)
	markdown := fmt.Sprintf("%s%d. %s\n", indent, (*numbering)[depth], content)

	for _, child := range block.Children {
		markdown += blockToMarkdown(child, depth+1, numbering)
	}

	return markdown
}

func bulletListItemToMarkdown(block Block, depth int, content string) string {
	indent := strings.Repeat("    ", depth)
	markdown := fmt.Sprintf("%s* %s\n", indent, content)
	for _, child := range block.Children {
		markdown += blockToMarkdown(child, depth+1, nil)
	}

	return markdown
}

func checkListItemToMarkdown(block Block, depth int, content string) string {
	indent := strings.Repeat("    ", depth)
	checked := "[ ]" // default unchecked
	if isChecked, ok := block.Props["checked"].(bool); ok && isChecked {
		checked = "[x]" // checked
	}

	// Format the current checklist item
	markdown := fmt.Sprintf("%s- %s %s\n", indent, checked, content)

	// Recursively format child items
	for _, child := range block.Children {
		markdown += blockToMarkdown(child, depth+1, nil) // Passing 'nil' because checklists do not require numbering
	}

	return markdown
}

func paragraphToMarkdown(content string) string {
	return fmt.Sprintf("%s\n\n", content)
}

func getTextContent(content interface{}) string {
	switch v := content.(type) {
	case []interface{}:
		var texts []string
		for _, item := range v {
			if contentItem, ok := item.(map[string]interface{}); ok {
				text := ""
				if t, ok := contentItem["text"].(string); ok {
					text = t
				}
				if styles, ok := contentItem["styles"].(map[string]interface{}); ok {
					text = applyTextStyles(text, styles)
				}
				texts = append(texts, text)
			}
		}
		return strings.Join(texts, "")
	case string:
		return v
	default:
		return ""
	}
}

func applyTextStyles(text string, styles map[string]interface{}) string {
	if bold, ok := styles["bold"].(bool); ok && bold {
		text = fmt.Sprintf("**%s**", text)
	}
	if italic, ok := styles["italic"].(bool); ok && italic {
		text = fmt.Sprintf("*%s*", text)
	}
	if underline, ok := styles["underline"].(bool); ok && underline {
		text = fmt.Sprintf("__%s__", text)
	}
	if strike, ok := styles["strike"].(bool); ok && strike {
		text = fmt.Sprintf("~~%s~~", text)
	}
	return text
}

func applyBlockStyles(content string, props map[string]interface{}) string {
	style := make(map[string]string)
	if textColor, ok := props["textColor"].(string); ok && textColor != "default" {
		style["color"] = textColor
	}
	if bgColor, ok := props["backgroundColor"].(string); ok && bgColor != "default" {
		style["backgroundColor"] = bgColor
	}
	if textAlignment, ok := props["textAlignment"].(string); ok && textAlignment != "left" {
		style["textAlign"] = textAlignment
	}

	if len(style) > 0 {
		styleString := "{"
		for key, value := range style {
			styleString += fmt.Sprintf("%s: '%s', ", key, value)
		}
		styleString = styleString[:len(styleString)-2] + "}"
		return fmt.Sprintf("<div style={%s}>%s</div>", styleString, content)
	}

	return content
}

func (service *DocService) writePagesToDirectory(pages []models.Page, dirPath string) error {
	for _, page := range pages {
		fullPage, err := service.GetPage(page.ID)
		if err != nil {
			return err
		}

		var fileName, content string
		var order uint

		if fullPage.IsIntroPage {
			fileName = "index.md"
			order = 0
		} else {
			fileName = utils.StringToFileString(fullPage.Title) + ".md"
			if fullPage.Order != nil {
				order = *fullPage.Order
			}
		}

		content, err = CraftPage(order, fullPage.Title, fullPage.Slug, fullPage.Content)

		if err != nil {
			return err
		}

		err = utils.WriteToFile(filepath.Join(dirPath, fileName), content)
		if err != nil {
			return err
		}
	}
	return nil
}

func (service *DocService) WriteContents(docId uint) error {
	doc, err := service.GetDocumentation(docId)
	if err != nil {
		return err
	}

	docPath := filepath.Join(config.ParsedConfig.DataPath, "docusaurus_data", "doc_"+strconv.Itoa(int(docId)))
	docsPath := filepath.Join(docPath, "docs")
	versionedDocsPath := filepath.Join(docPath, "versioned_docs")
	versionedSidebarsPath := filepath.Join(docPath, "versioned_sidebars")

	for _, path := range []string{docsPath, versionedDocsPath, versionedSidebarsPath} {
		if !utils.PathExists(path) {
			if err := utils.MakeDir(path); err != nil {
				return err
			}
		}
	}

	if err := service.writePagesToDirectory(doc.Pages, docsPath); err != nil {
		return err
	}

	childrenIds, err := service.GetChildrenOfDocumentation(docId)
	if err != nil {
		return err
	}

	versions := []string{doc.Version}

	if len(childrenIds) == 0 {
		versionDirName := fmt.Sprintf("version-%s", doc.Version)
		versionedDocPath := filepath.Join(versionedDocsPath, versionDirName)

		if err := utils.MakeDir(versionedDocPath); err != nil {
			return err
		}

		if err := service.writePagesToDirectory(doc.Pages, versionedDocPath); err != nil {
			return err
		}

		sidebarContent := `{
            "mainSidebar": [
                {
                    "type": "autogenerated",
                    "dirName": "."
                }
            ]
        }`
		sidebarFileName := fmt.Sprintf("version-%s-sidebars.json", doc.Version)
		if err := utils.WriteToFile(filepath.Join(versionedSidebarsPath, sidebarFileName), sidebarContent); err != nil {
			return err
		}
	} else {
		for _, childId := range childrenIds {
			childDoc, err := service.GetDocumentation(childId)
			if err != nil {
				return err
			}

			versions = append(versions, childDoc.Version)

			versionDirName := fmt.Sprintf("version-%s", childDoc.Version)
			versionedDocPath := filepath.Join(versionedDocsPath, versionDirName)

			if err := utils.MakeDir(versionedDocPath); err != nil {
				return err
			}

			if err := service.writePagesToDirectory(childDoc.Pages, versionedDocPath); err != nil {
				return err
			}

			sidebarContent := `{
                "mainSidebar": [
                    {
                        "type": "autogenerated",
                        "dirName": "."
                    }
                ]
            }`
			sidebarFileName := fmt.Sprintf("version-%s-sidebars.json", childDoc.Version)
			if err := utils.WriteToFile(filepath.Join(versionedSidebarsPath, sidebarFileName), sidebarContent); err != nil {
				return err
			}
		}
	}

	versionsJSON, err := json.Marshal(versions)
	if err != nil {
		return err
	}
	if err := utils.WriteToFile(filepath.Join(docPath, "versions.json"), string(versionsJSON)); err != nil {
		return err
	}

	return nil
}
