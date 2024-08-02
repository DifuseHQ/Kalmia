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

type Props struct {
	Level           int    `json:"level"`
	TextColor       string `json:"textColor"`
	BackgroundColor string `json:"backgroundColor"`
	TextAlignment   string `json:"textAlignment"`
}

type TextContent struct {
	Type   string                 `json:"type"`
	Text   string                 `json:"text"`
	Styles map[string]interface{} `json:"styles"`
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
		markdown += blockToMarkdown(block, 0)
	}

	return fmt.Sprintf("---\nsidebar_position: %d\ntitle: %s\nslug: %s\n---\n\n%s", position, title, slug, markdown), nil
}

func blockToMarkdown(block Block, depth int) string {
	switch block.Type {
	case "heading":
		level, _ := block.Props["level"].(float64)
		text := getTextContent(block.Content)
		return fmt.Sprintf("%s %s\n\n", strings.Repeat("#", int(level)), text)
	case "paragraph":
		return fmt.Sprintf("%s\n\n", getTextContent(block.Content))
	case "numberedListItem":
		return listItemToMarkdown(block, depth, "1. ")
	case "bulletListItem":
		return listItemToMarkdown(block, depth, "- ")
	default:
		return ""
	}
}

func listItemToMarkdown(block Block, depth int, prefix string) string {
	indent := strings.Repeat("  ", depth)
	content := getTextContent(block.Content)
	markdown := fmt.Sprintf("%s%s%s\n", indent, prefix, content)

	for _, child := range block.Children {
		markdown += blockToMarkdown(child, depth+1)
	}

	if len(block.Children) > 0 || depth == 0 {
		markdown += "\n"
	}

	return markdown
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
					text = applyStyles(text, styles)
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

func applyStyles(text string, styles map[string]interface{}) string {
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
