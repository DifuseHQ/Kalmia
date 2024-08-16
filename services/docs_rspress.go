package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/embedded"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"go.uber.org/zap"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
	"gorm.io/gorm"
)

type Block = utils.Block

type Versions struct {
	Default  string   `json:"default"`
	Versions []string `json:"versions"`
}

type VersionInfo struct {
	Version   string
	CreatedAt time.Time
	DocId     uint
}

type MetaElement struct {
	Type        string `json:"type"`
	Name        string `json:"name"`
	Label       string `json:"label"`
	Path        string `json:"path"`
	Order       uint   `json:"-"`
	Collapsible *bool  `json:"collapsible,omitempty"`
	Collapsed   *bool  `json:"collapsed,omitempty"`
}

type SocialLink struct {
	Label string `json:"icon"`
	Link  string `json:"link"`
}

type MoreLink struct {
	Label string `json:"label"`
	Link  string `json:"link"`
}

type SocialLinkRsPress struct {
	Icon    string `json:"icon"`
	Mode    string `json:"mode"`
	Content string `json:"content"`
}

type MetaData struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Image       string `json:"image"`
}

func (service *DocService) GenerateHead(docID uint, pageId uint, pageType string) (string, error) {
	var buffer bytes.Buffer
	doc, err := service.GetDocumentation(docID)

	if err != nil {
		return "", err
	}

	if pageId == math.MaxUint32 {
		buffer.WriteString("---\n")
		buffer.WriteString(fmt.Sprintf("pageType: %s\n", pageType))
		buffer.WriteString("footer: true\n")
		buffer.WriteString(fmt.Sprintf("title: %s\n", doc.Name))
		buffer.WriteString("---\n\n")

		buffer.WriteString("import { Redirect } from '@components/Redirect';\n\n")
		buffer.WriteString("import { Meta } from '@components/Meta';\n\n")

		metaTitle := doc.Name
		metaDescription := doc.Description

		var metaImage string

		if doc.MetaImage != "" {
			metaImage = doc.MetaImage
		} else {
			metaImage = "https://imagedelivery.net/SM0H54GQmiDTGcg4Xr4iPA/c5359df9-c88f-4767-397e-ee4299a42c00/public"
		}

		meta := MetaData{
			Title:       metaTitle,
			Description: metaDescription,
			Image:       metaImage,
		}

		metaJSON, err := json.Marshal(meta)

		if err != nil {
			return "", err
		}

		buffer.WriteString(fmt.Sprintf(`<Meta rawJson='%s' />%s`, string(metaJSON), "\n"))
		buffer.WriteString(fmt.Sprintf(`<Redirect to={'%s'} />%s`, doc.BaseURL+"/guides", "\n\n"))

		return buffer.String(), nil
	} else {
		page, err := service.GetPage(pageId)
		if err != nil {
			return "", err
		}

		buffer.WriteString("---\n")
		buffer.WriteString(fmt.Sprintf("pageType: %s\n", pageType))
		buffer.WriteString("footer: true\n")
		buffer.WriteString(fmt.Sprintf("title: %s\n", page.Title))
		buffer.WriteString("---\n\n")

		buffer.WriteString("import { Meta } from '@components/Meta';\n")

		componentTypes := []string{"paragraph", "table", "image", "video", "audio", "file", "alert"}
		caser := cases.Title(language.English)
		addedComponents := make(map[string]bool)
		contentObjects := strings.Split(strings.Trim(page.Content, "[]"), "},{")

		for _, obj := range contentObjects {
			for _, componentType := range componentTypes {
				if strings.Contains(obj, fmt.Sprintf(`"type":"%s"`, componentType)) && !addedComponents[componentType] {
					componentName := caser.String(componentType)
					buffer.WriteString(fmt.Sprintf(`import { %s } from "@components/%s";%s`, componentName, componentName, "\n"))
					addedComponents[componentType] = true
				}
			}
		}

		buffer.WriteString("\n\n")

		metaTitle := doc.Name
		metaDescription := doc.Description

		var metaImage string

		if doc.MetaImage != "" {
			metaImage = doc.MetaImage
		} else {
			metaImage = "https://imagedelivery.net/SM0H54GQmiDTGcg4Xr4iPA/c5359df9-c88f-4767-397e-ee4299a42c00/public"
		}

		meta := MetaData{
			Title:       metaTitle,
			Description: metaDescription,
			Image:       metaImage,
		}

		metaJSON, err := json.Marshal(meta)

		if err != nil {
			return "", err
		}

		buffer.WriteString(fmt.Sprintf(`<Meta rawJson='%s' />%s`, string(metaJSON), "\n\n"))

		return buffer.String(), nil
	}
}

func (service *DocService) RemoveDocFolder(docId uint) error {
	docPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data", "doc_"+strconv.Itoa(int(docId)))

	if err := utils.RemovePath(docPath); err != nil {
		return err
	}

	return nil
}

func (service *DocService) UpdateWriteBuild(docId uint) error {
	key := fmt.Sprintf("update_write_build_%d", docId)
	var mutex *sync.Mutex
	mutexI, _ := service.UWBMutexMap.LoadOrStore(key, &sync.Mutex{})
	mutex = mutexI.(*sync.Mutex)
	acquired := make(chan bool, 1)
	go func() {
		mutex.Lock()
		acquired <- true
	}()
	select {
	case <-acquired:
		defer mutex.Unlock()
	case <-time.After(1 * time.Minute):
		return fmt.Errorf("timeout waiting for operation to complete for docId: %d", docId)
	}

	rootParentId, err := service.GetRootParentID(docId)

	if err != nil {
		return err
	}

	allDocsPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data")
	docsPath := filepath.Join(allDocsPath, "doc_"+strconv.Itoa(int(rootParentId)))
	if !utils.PathExists(docsPath) {
		err := utils.MakeDir(docsPath)
		if err != nil {
			return err
		}
	}

	err = service.UpdateBasicData(docId, rootParentId)
	if err != nil {
		if err.Error() == "documentation_not_found" {
			if err := service.RemoveDocFolder(docId); err != nil {
				return err
			}
			return nil
		} else {
			logger.Error("Failed to update basic data -> ", zap.Uint("doc_id", docId), zap.Error(err))
		}
		return err
	}

	err = service.WriteContents(docId, rootParentId)
	if err != nil {
		logger.Error("Failed to write contents -> ", zap.Uint("doc_id", docId), zap.Error(err))
		return err
	}

	err = service.RsPressBuild(rootParentId)
	if err != nil {
		logger.Error("Failed to build RsPress -> ", zap.Uint("doc_id", docId), zap.Error(err))
		return err
	}

	return nil
}

func (service *DocService) StartupCheck() error {
	logger.Debug("Starting DocService.StartupCheck")
	npmPinged := utils.NpmPing()
	if !npmPinged {
		logger.Panic("Startup check failed for NPM, exiting...")
	}

	db := service.DB
	var docs []models.Documentation
	if err := db.Find(&docs).Error; err != nil {
		logger.Error("Failed to fetch documents from database", zap.Error(err))
		return err
	}

	for _, doc := range docs {
		if doc.ClonedFrom == nil {
			allDocsPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data")
			docsPath := filepath.Join(allDocsPath, "doc_"+strconv.Itoa(int(doc.ID)))

			startTime := time.Now()
			if err := service.InitRsPress(doc.ID, true); err != nil {
				logger.Error("Failed to initialize/update RsPress", zap.Uint("doc_id", doc.ID), zap.Error(err))
				return err
			}
			elapsedTime := time.Since(startTime)
			logger.Info("Documentation initialized/updated",
				zap.Uint("doc_id", doc.ID),
				zap.String("elapsed", elapsedTime.String()),
			)

			if err := utils.RunNpmCommand(docsPath, "install", "--prefer-offline", "--no-audit", "--progress=false", "--no-fund"); err != nil {
				logger.Error("Failed to run npm install", zap.Uint("doc_id", doc.ID), zap.Error(err))
				return err
			}

			err := service.AddBuildTrigger(doc.ID)
			if err != nil {
				logger.Error("Failed to add build trigger", zap.Uint("doc_id", doc.ID), zap.Error(err))
				return err
			}
		}
	}

	logger.Debug("DocService.StartupCheck completed successfully")
	return nil
}

func (service *DocService) InitRsPress(docId uint, init bool) error {
	cfg := config.ParsedConfig
	allDocsPath := filepath.Join(cfg.DataPath, "rspress_data")
	docsPath := filepath.Join(allDocsPath, "doc_"+strconv.Itoa(int(docId)))

	err := embedded.CopyInitFiles(docsPath)
	if err != nil {
		return fmt.Errorf("failed to copy/update init files: %w", err)
	}

	if init {
		npmPing := utils.NpmPing()
		if !npmPing {
			return fmt.Errorf("NPM ping failed for %d initialization", docId)
		}

		if err := utils.RunNpmCommand(docsPath, "install", "--prefer-offline", "--no-audit", "--progress=false", "--no-fund"); err != nil {
			return fmt.Errorf("failed to run npm install for doc %d: %w", docId, err)
		}
	}

	return nil
}

func (service *DocService) UpdateBasicData(docId uint, rootParentId uint) error {
	doc, err := service.GetDocumentation(docId)
	if err != nil {
		return err
	}

	docConfigTemplate, err := embedded.ReadEmbeddedFile("rspress.config.ts")

	if err != nil {
		return err
	}

	docPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data", "doc_"+strconv.Itoa(int(rootParentId)))
	docConfig := filepath.Join(docPath, "rspress.config.ts")

	replacements := map[string]string{
		"__TITLE__":             doc.Name,
		"__TAG_LINE__":          doc.Description,
		"__BASE_URL__":          doc.BaseURL,
		"__FAVICON__":           "https://downloads-bucket.difuse.io/favicon-final-kalmia.ico",
		"__META_IMAGE__":        "https://imagedelivery.net/SM0H54GQmiDTGcg4Xr4iPA/c5359df9-c88f-4767-397e-ee4299a42c00/public",
		"__NAVBAR_TITLE__":      "doc.Name",
		"__LOGO_LIGHT__":        "https://downloads-bucket.difuse.io/kalmia-sideways-black.png",
		"__LOGO_DARK__":         "https://downloads-bucket.difuse.io/kalmia-sideways-white.png",
		"__COPYRIGHT_TEXT__":    "Iridia Solutions Pvt. Ltd. Built With Kalmia",
		"__URL__":               "http://localhost:3000",
		"__ORGANIZATION_NAME__": "Iridia Solutions Pvt. Ltd.",
		"__PROJECT_NAME__":      "Kalmia",
		"__SOCIAL_LINKS__":      "[]",
		"__FOOTER_CONTENT__":    "Made with ❤️ by Difuse",
	}

	if doc.NavImage != "" {
		replacements["__LOGO_LIGHT__"] = doc.NavImage
	}

	if doc.NavImageDark != "" {
		replacements["__LOGO_DARK__"] = doc.NavImageDark
	}

	if doc.Favicon != "" {
		replacements["__FAVICON__"] = doc.Favicon
	}

	if doc.MetaImage != "" {
		replacements["__META_IMAGE__"] = doc.MetaImage
	}

	if doc.CopyrightText != "" {
		replacements["__COPYRIGHT_TEXT__"] = doc.CopyrightText
	}

	if doc.URL != "" {
		replacements["__URL__"] = doc.URL
	}

	if doc.FooterLabelLinks != "" {
		var socialLinks []SocialLink
		var socialLinksRsPress []SocialLinkRsPress

		err := json.Unmarshal([]byte(doc.FooterLabelLinks), &socialLinks)

		if err != nil {
			replacements["__SOCIAL_LINKS__"] = "[]"
		}

		for _, link := range socialLinks {
			socialLinksRsPress = append(socialLinksRsPress, SocialLinkRsPress{Icon: utils.ToLowerCase(link.Label), Mode: "link", Content: link.Link})
		}

		socialLinksJSON, err := json.Marshal(socialLinksRsPress)

		if err != nil {
			replacements["__SOCIAL_LINKS__"] = "[]"
		}

		replacements["__SOCIAL_LINKS__"] = string(socialLinksJSON)
	}

	if doc.MoreLabelLinks != "" {
		var moreLinks []MoreLink
		var links string
		err := json.Unmarshal([]byte(doc.MoreLabelLinks), &moreLinks)

		if err != nil {
			links = ""
		} else {
			for _, link := range moreLinks {
				links += fmt.Sprintf(`<a href="%s" target="_blank">%s</a>`, link.Link, link.Label)
			}
		}

		replacements["__FOOTER_CONTENT__"] = fmt.Sprintf(`
		<footer class="text-center">
		  <div class="copyright">
			<p class="text-sm">&copy; %d %s</p>
		  </div>
		  <nav class="flex justify-center flex-wrap mt-2 space-x-4">
		%s
		  </nav>
		</footer>`, time.Now().UTC().Year(), doc.CopyrightText, links)
	} else {
		replacements["__FOOTER_CONTENT__"] = "Made with ❤️ by Iridia Solutions Pvt. Ltd."
	}

	if err := os.Remove(docConfig); err != nil {
		return err
	}

	latest, versions, err := service.GetAllVersions(docId)

	if err != nil {
		return err
	}

	multiVersions := Versions{Default: latest, Versions: versions}
	multiVersionsJSON, err := json.Marshal(multiVersions)

	if err != nil {
		return err
	}

	replacements["__MULTI_VERSIONS__"] = "multiVersion: " + string(multiVersionsJSON)

	err = utils.WriteToFile(docConfig, utils.ReplaceMany(string(docConfigTemplate), replacements))

	if err != nil {
		return err
	}

	return nil
}

func (service *DocService) CraftPage(pageID uint, title string, slug string, content string) (string, error) {
	var blocks []Block
	err := json.Unmarshal([]byte(content), &blocks)
	if err != nil {
		return "", err
	}

	markdown := ""
	for _, block := range blocks {
		markdown += utils.BlockToMarkdown(block, 0, nil)
	}

	docId, err := service.GetDocIdByPageId(pageID)

	if err != nil {
		return "", err
	}

	top, err := service.GenerateHead(docId, pageID, "doc")

	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%s%s", top, markdown), nil
}

func (service *DocService) writePagesToDirectory(pages []models.Page, dirPath string) error {
	var metaElements []MetaElement

	sort.Slice(pages, func(i, j int) bool {
		if pages[i].Order == nil || pages[j].Order == nil {
			return false
		}
		return *pages[i].Order < *pages[j].Order
	})

	for _, page := range pages {
		fullPage, err := service.GetPage(page.ID)
		if err != nil {
			return err
		}

		var fileName, content string
		content, err = service.CraftPage(fullPage.ID, fullPage.Title, fullPage.Slug, fullPage.Content)
		if err != nil {
			return err
		}

		markdownExt := ".mdx"

		if fullPage.IsIntroPage {
			fileName = "index" + markdownExt
		} else {
			fileName = utils.StringToFileString(fullPage.Title) + markdownExt
		}

		err = utils.WriteToFile(filepath.Join(dirPath, fileName), content)
		if err != nil {
			return err
		}

		order := uint(0)
		if fullPage.Order != nil {
			order = *fullPage.Order
		}

		if fullPage.IsIntroPage {
			metaElements = append(metaElements, MetaElement{
				Type:  "file",
				Name:  "index",
				Label: fullPage.Title,
				Path:  "/",
				Order: 0,
			})
		} else {
			metaElements = append(metaElements, MetaElement{
				Type:  "file",
				Name:  utils.StringToFileString(fullPage.Title),
				Label: fullPage.Title,
				Path:  fullPage.Slug,
				Order: order,
			})
		}
	}

	return writeMetaJSON(metaElements, dirPath)
}

func (service *DocService) writePageGroupsToDirectory(pageGroups []models.PageGroup, dirPath string, docId uint) error {
	for _, pageGroup := range pageGroups {
		if pageGroup.DocumentationID != docId {
			continue
		}

		pageGroupDir := utils.StringToFileString(pageGroup.Name)
		fullPath := filepath.Join(dirPath, pageGroupDir)
		if !utils.PathExists(fullPath) {
			if err := utils.MakeDir(fullPath); err != nil {
				return err
			}
		}

		var metaElements []MetaElement

		// Write pages directly in this page group
		pages, err := service.GetPagesOfPageGroup(pageGroup.ID)
		if err != nil {
			return err
		}
		if err := service.writePagesToDirectory(pages, fullPath); err != nil {
			return err
		}

		// Add pages to meta elements
		for _, page := range pages {
			order := uint(0)
			if page.Order != nil {
				order = *page.Order
			}
			metaElements = append(metaElements, MetaElement{
				Type:  "file",
				Name:  utils.StringToFileString(page.Title),
				Label: page.Title,
				Path:  page.Slug,
				Order: order,
			})
		}

		// Handle nested page groups
		var nestedPageGroups []models.PageGroup
		if err := service.DB.Where("parent_id = ?", pageGroup.ID).Find(&nestedPageGroups).Error; err != nil {
			return err
		}

		for _, nestedGroup := range nestedPageGroups {
			nestedGroupDir := utils.StringToFileString(nestedGroup.Name)
			nestedFullPath := filepath.Join(fullPath, nestedGroupDir)
			if !utils.PathExists(nestedFullPath) {
				if err := utils.MakeDir(nestedFullPath); err != nil {
					return err
				}
			}

			if err := service.writePageGroupsToDirectory([]models.PageGroup{nestedGroup}, fullPath, docId); err != nil {
				return err
			}

			order := uint(0)
			if nestedGroup.Order != nil {
				order = *nestedGroup.Order
			}
			metaElements = append(metaElements, MetaElement{
				Type:        "dir",
				Name:        utils.StringToFileString(nestedGroup.Name),
				Label:       nestedGroup.Name,
				Path:        utils.StringToFileString(nestedGroup.Name),
				Order:       order,
				Collapsible: &[]bool{true}[0],
				Collapsed:   &[]bool{true}[0],
			})
		}

		// Write _meta.json for the current page group
		if err := writeMetaJSON(metaElements, fullPath); err != nil {
			return err
		}
	}

	return nil
}

func writeMetaJSON(metaElements []MetaElement, dirPath string) error {
	// Sort metaElements
	sort.Slice(metaElements, func(i, j int) bool {
		if metaElements[i].Order != metaElements[j].Order {
			return metaElements[i].Order < metaElements[j].Order
		}
		return metaElements[i].Name < metaElements[j].Name
	})

	var metaJSON []byte
	var err error

	if len(metaElements) == 0 {
		// Write an empty array instead of null
		metaJSON = []byte("[]")
	} else {
		metaJSON, err = json.MarshalIndent(metaElements, "", "    ")
		if err != nil {
			return fmt.Errorf("error marshaling meta elements: %w", err)
		}
	}

	metaFilePath := filepath.Join(dirPath, "_meta.json")
	err = os.WriteFile(metaFilePath, metaJSON, 0644)
	if err != nil {
		return fmt.Errorf("error writing _meta.json file: %w", err)
	}

	return nil
}

func (service *DocService) buildVersionTree(docId uint) ([]VersionInfo, error) {
	doc, err := service.GetDocumentation(docId)
	if err != nil {
		return nil, err
	}

	versionTree := []VersionInfo{{Version: doc.Version, CreatedAt: *doc.CreatedAt, DocId: doc.ID}}

	childrenIds, err := service.GetChildrenOfDocumentation(docId)
	if err != nil {
		return nil, err
	}

	for _, childId := range childrenIds {
		childVersions, err := service.buildVersionTree(childId)
		if err != nil {
			return nil, err
		}
		versionTree = append(versionTree, childVersions...)
	}

	return versionTree, nil
}

func (service *DocService) WriteContents(docId uint, rootParentId uint) error {
	docIdPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data", "doc_"+strconv.Itoa(int(rootParentId)))
	_, err := service.GetDocumentation(docId)

	if err != nil {
		if err.Error() == "documentation_not_found" {
			if err := utils.RemovePath(docIdPath); err != nil {
				return err
			}
		}
		return err
	}

	docsPath := filepath.Join(docIdPath, "docs")

	for _, path := range []string{docIdPath, docsPath} {
		if err := utils.MakeDir(path); err != nil {
			return err
		}
	}

	versionInfos, err := service.buildVersionTree(docId)

	if err != nil {
		return err
	}

	for _, versionInfo := range versionInfos {
		versionDoc, err := service.GetDocumentation(versionInfo.DocId)

		if err != nil {
			return err
		}

		versionedDocPath := filepath.Join(docsPath, versionInfo.Version)

		if !utils.PathExists(versionedDocPath) {
			if err := utils.MakeDir(versionedDocPath); err != nil {
				return err
			}
		}

		var rootPageGroups []models.PageGroup

		if err := service.DB.Where("parent_id IS NULL AND documentation_id = ?", versionDoc.ID).Preload("Pages").Find(&rootPageGroups).Error; err != nil {
			return err
		}

		cleanedBase := "guides"

		var rootMeta string

		if versionDoc.LanderDetails != "" && versionDoc.LanderDetails != "{}" {
			rootMeta = fmt.Sprintf(`[{"text": "Home","link": "%s","activeMatch": "/%s/home"}, {"text": "Documentation","link": "/%s/index","activeMatch": "/%s/"}]`, versionDoc.BaseURL, cleanedBase, cleanedBase, cleanedBase)
		} else {
			rootMeta = fmt.Sprintf(`[{"text": "Documentation","link": "/%s/index","activeMatch": "/%s/"}]`, cleanedBase, cleanedBase)
		}

		var customCSS strings.Builder

		customCSS.WriteString("@tailwind base;\n")
		customCSS.WriteString("@tailwind components;\n")
		customCSS.WriteString("@tailwind utilities;\n\n")

		if versionDoc.CustomCSS != "" {
			customCSS.WriteString(versionDoc.CustomCSS)
		}

		if err := utils.WriteToFile(filepath.Join(versionedDocPath, "../../", "styles", "input.css"), customCSS.String()); err != nil {
			return err
		}

		if err := utils.WriteToFile(filepath.Join(versionedDocPath, "_meta.json"), rootMeta); err != nil {
			return err
		}

		userContentPath := filepath.Join(versionedDocPath, cleanedBase)

		if !utils.PathExists(userContentPath) {
			if err := utils.MakeDir(userContentPath); err != nil {
				return err
			}
		}

		if err := service.WriteHomePage(versionDoc, userContentPath); err != nil {
			return err
		}

		var rootMetaElements []MetaElement

		// Write pages directly in the userContentPath
		if err := service.writePagesToDirectory(versionDoc.Pages, userContentPath); err != nil {
			return err
		}

		// Add pages to root meta elements
		for _, page := range versionDoc.Pages {
			order := uint(0)
			if page.Order != nil {
				order = *page.Order
			}

			if page.IsIntroPage {
				rootMetaElements = append(rootMetaElements, MetaElement{
					Type:  "file",
					Name:  "index",
					Label: page.Title,
					Path:  "/",
					Order: order,
				})
			} else {
				rootMetaElements = append(rootMetaElements, MetaElement{
					Type:  "file",
					Name:  utils.StringToFileString(page.Title),
					Label: page.Title,
					Path:  page.Slug,
					Order: order,
				})
			}
		}

		// Write page groups
		if err := service.writePageGroupsToDirectory(rootPageGroups, userContentPath, versionDoc.ID); err != nil {
			return err
		}

		// Add page groups to root meta elements
		for _, group := range rootPageGroups {
			order := uint(0)
			if group.Order != nil {
				order = *group.Order
			}
			rootMetaElements = append(rootMetaElements, MetaElement{
				Type:        "dir",
				Name:        utils.StringToFileString(group.Name),
				Label:       group.Name,
				Path:        utils.StringToFileString(group.Name),
				Order:       order,
				Collapsible: &[]bool{true}[0],
				Collapsed:   &[]bool{true}[0],
			})
		}

		// Write root _meta.json
		if err := writeMetaJSON(rootMetaElements, userContentPath); err != nil {
			return err
		}
	}

	return nil
}

func (service *DocService) WriteHomePage(documentation models.Documentation, contentPath string) error {
	var homePage string
	var homePagePath string

	if documentation.LanderDetails != "" && documentation.LanderDetails != "{}" {
		var landerDetails struct {
			CtaButtonText struct {
				CtaButtonLinkLabel string `json:"ctaButtonLinkLabel"`
				CtaButtonLink      string `json:"ctaButtonLink"`
			} `json:"ctaButtonText"`
			SecondCtaButtonText struct {
				CtaButtonLinkLabel string `json:"ctaButtonLinkLabel"`
				CtaButtonLink      string `json:"ctaButtonLink"`
			} `json:"secondCtaButtonText"`
			CtaImageLink string `json:"ctaImageLink"`
			Features     []struct {
				Emoji string `json:"emoji"`
				Title string `json:"title"`
				Text  string `json:"text"`
			} `json:"features"`
		}

		err := json.Unmarshal([]byte(documentation.LanderDetails), &landerDetails)

		if err != nil {
			return fmt.Errorf("error unmarshaling LanderDetails: %w", err)
		}

		var yamlBuilder strings.Builder
		yamlBuilder.WriteString("---\n")
		yamlBuilder.WriteString("pageType: home\n")
		yamlBuilder.WriteString("hero:\n")
		yamlBuilder.WriteString(fmt.Sprintf("  name: %s\n", documentation.Name))
		yamlBuilder.WriteString(fmt.Sprintf("  text: %s\n", documentation.Description))
		yamlBuilder.WriteString("  actions:\n")
		yamlBuilder.WriteString(fmt.Sprintf("    - theme: brand\n      text: %s\n      link: %s\n",
			landerDetails.CtaButtonText.CtaButtonLinkLabel,
			landerDetails.CtaButtonText.CtaButtonLink))
		yamlBuilder.WriteString(fmt.Sprintf("    - theme: alt\n      text: %s\n      link: %s\n",
			landerDetails.SecondCtaButtonText.CtaButtonLinkLabel,
			landerDetails.SecondCtaButtonText.CtaButtonLink))

		if landerDetails.CtaImageLink != "" {
			yamlBuilder.WriteString("  image:\n")
			yamlBuilder.WriteString(fmt.Sprintf("    src: %s\n", landerDetails.CtaImageLink))
			yamlBuilder.WriteString("    alt: Kalmia Logo\n")
		}

		if len(landerDetails.Features) > 0 {
			yamlBuilder.WriteString("features:\n")
			for _, feature := range landerDetails.Features {
				yamlBuilder.WriteString(fmt.Sprintf("  - title: %s\n", feature.Title))
				yamlBuilder.WriteString(fmt.Sprintf("    details: %s\n", feature.Text))
				yamlBuilder.WriteString(fmt.Sprintf("    icon: %s\n", utils.ConvertToEmoji(feature.Emoji)))
			}
		}

		yamlBuilder.WriteString("---\n")
		homePage = yamlBuilder.String()
		homePagePath = filepath.Join(contentPath, "../", "index.mdx")
	} else {
		head, err := service.GenerateHead(documentation.ID, math.MaxUint32, "doc")

		if err != nil {
			logger.Error("Failed to generate head for home page", zap.Error(err))
		}

		if head != "" {
			homePage = head
		}

		homePage += fmt.Sprintf("\n\n <meta http-equiv=\"refresh\" content=\"0;url=%s\" />", documentation.BaseURL+"/guides")
		homePagePath = filepath.Join(contentPath, "../", "index.mdx")
	}

	if err := utils.WriteToFile(homePagePath, homePage); err != nil {
		return err
	}
	return nil
}

func (service *DocService) RsPressBuild(docId uint) error {
	docPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data", "doc_"+strconv.Itoa(int(docId)))
	buildPath := filepath.Join(docPath, "build")
	tmpBuildPath := filepath.Join(docPath, "build_tmp")

	err := utils.RunNpxCommand(docPath, "tailwindcss", "build", "-i", "styles/input.css", "-o", "styles/output.css")

	if err != nil {
		return err
	}

	err = utils.RunNpxCommand(docPath, "rspress", "build")
	if err != nil {
		return err
	}

	if _, err := os.Stat(buildPath); err == nil {
		if err := os.RemoveAll(buildPath); err != nil {
			return fmt.Errorf("failed to remove old build directory: %w", err)
		}
	}

	if err := os.Rename(tmpBuildPath, buildPath); err != nil {
		return fmt.Errorf("failed to rename build_tmp to build: %w", err)
	}

	return nil
}

func (service *DocService) GetRsPress(urlPath string) (string, string, error) {
	var doc models.Documentation
	var err error

	dialectName := strings.ToLower(service.DB.Dialector.Name())

	var query string
	var args []interface{}

	switch dialectName {
	case "sqlite":
		query = "? LIKE base_url || ?"
		args = []interface{}{urlPath, "%"}
	case "postgres":
		query = "? LIKE base_url || ?"
		args = []interface{}{urlPath, "%"}
	default:
		return "", "", fmt.Errorf("unsupported_database_type: %s", dialectName)
	}

	err = service.DB.Where(query, args...).
		Order("LENGTH(base_url) DESC").
		First(&doc).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", "", fmt.Errorf("doc_does_not_exist")
		}
		return "", "", fmt.Errorf("database_error: %v", err)
	}

	docPath := filepath.Join("data", "rspress_data", fmt.Sprintf("doc_%d", doc.ID), "build")

	if _, err := os.Stat(docPath); os.IsNotExist(err) {
		return "", "", fmt.Errorf("rspress_build_not_found")
	}

	files, err := os.ReadDir(docPath)
	if err != nil {
		return "", "", fmt.Errorf("error_reading_rspress_directory")
	}

	if len(files) == 0 {
		return "", "", fmt.Errorf("rspress_build_empty")
	}

	return docPath, doc.BaseURL, nil
}

func (service *DocService) AddBuildTrigger(docId uint) error {
	trigger := models.BuildTriggers{
		DocumentationID: docId,
		Triggered:       false,
		CompletedAt:     nil,
	}
	if err := service.DB.Create(&trigger).Error; err != nil {
		return err
	}
	return nil
}

func (service *DocService) BuildJob() {
	var triggers []models.BuildTriggers
	if err := service.DB.Where("triggered = ?", false).Find(&triggers).Error; err != nil {
		logger.Error("Failed to fetch build triggers", zap.Error(err))
		return
	}

	if len(triggers) == 0 {
		return
	}

	triggerGroups := make(map[uint][]models.BuildTriggers)
	for _, trigger := range triggers {
		triggerGroups[trigger.DocumentationID] = append(triggerGroups[trigger.DocumentationID], trigger)
	}

	for docID, groupTriggers := range triggerGroups {
		start := time.Now()

		err := service.UpdateWriteBuild(docID)
		elapsed := time.Since(start)

		if err != nil {
			logger.Error("Failed to update write build",
				zap.Uint("doc_id", docID),
				zap.Error(err),
				zap.Duration("elapsed", elapsed),
				zap.Int("trigger_count", len(groupTriggers)))
		} else {
			logger.Info("RsPress Build completed",
				zap.Uint("doc_id", docID),
				zap.Duration("elapsed", elapsed),
				zap.Int("trigger_count", len(groupTriggers)))
		}

		now := time.Now()
		for i := range groupTriggers {
			groupTriggers[i].Triggered = true
			groupTriggers[i].CompletedAt = utils.TimePtr(now)
		}

		if err := service.DB.Save(&groupTriggers).Error; err != nil {
			logger.Error("Failed to save build triggers",
				zap.Uint("doc_id", docID),
				zap.Error(err),
				zap.Int("trigger_count", len(groupTriggers)))
		}
	}
}

func (service *DocService) GetLastTrigger() ([]models.BuildTriggers, error) {
	var allTriggers []models.BuildTriggers

	if err := service.DB.Order("documentation_id, created_at DESC").Find(&allTriggers).Error; err != nil {
		return nil, err
	}

	latestTriggers := make(map[uint]models.BuildTriggers)
	for _, t := range allTriggers {
		existing, exists := latestTriggers[t.DocumentationID]
		if !exists {
			latestTriggers[t.DocumentationID] = t
		} else {
			if t.CreatedAt != nil && existing.CreatedAt != nil {
				if t.CreatedAt.After(*existing.CreatedAt) {
					latestTriggers[t.DocumentationID] = t
				}
			} else if t.CreatedAt != nil {
				latestTriggers[t.DocumentationID] = t
			}
		}
	}

	result := make([]models.BuildTriggers, 0, len(latestTriggers))
	for _, t := range latestTriggers {
		result = append(result, t)
	}

	return result, nil
}
