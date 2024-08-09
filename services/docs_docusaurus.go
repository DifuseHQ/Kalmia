package services

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type Block struct {
	Type     string                 `json:"type"`
	Props    map[string]interface{} `json:"props"`
	Content  interface{}            `json:"content"`
	Children []Block                `json:"children"`
}

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

func copyInitFiles(to string) error {
	toCopy := []string{
		"package.json",
		"rspress.config.ts",
		"tsconfig.json",
		"tailwind.config.js",
		"styles/",
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

	allDocsPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data")
	docsPath := filepath.Join(allDocsPath, "doc_"+strconv.Itoa(int(docId)))
	if !utils.PathExists(docsPath) {
		err := utils.MakeDir(docsPath)
		if err != nil {
			return err
		}
	}

	err := service.UpdateBasicData(docId)
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

	err = service.WriteContents(docId)
	if err != nil {
		logger.Error("Failed to write contents -> ", zap.Uint("doc_id", docId), zap.Error(err))
		return err
	}

	err = service.DocusaurusBuild(docId)
	if err != nil {
		logger.Error("Failed to build docusaurus -> ", zap.Uint("doc_id", docId), zap.Error(err))
		return err
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
			allDocsPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data")
			docsPath := filepath.Join(allDocsPath, "doc_"+strconv.Itoa(int(doc.ID)))

			if !utils.PathExists(docsPath) {
				if err := service.InitDocusaurus(doc.ID, true); err != nil {
					return err
				}

				logger.Info("Document initialized -> ", zap.Uint("doc_id", doc.ID))
			} else {
				if err := utils.RunNpmCommand(docsPath, "install", "--prefer-offline", "--no-audit", "--progress=false", "--no-fund"); err != nil {
					removeErr := utils.RemovePath(docsPath)
					if removeErr != nil {
						return fmt.Errorf("failed to remove path %s: %w", docsPath, removeErr)
					}

					if err := service.InitDocusaurus(doc.ID, true); err != nil {
						return err
					}
				}
			}

			err := service.AddBuildTrigger(doc.ID)

			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (service *DocService) InitDocusaurus(docId uint, init bool) error {
	cfg := config.ParsedConfig

	if init {
		allDocsPath := filepath.Join(cfg.DataPath, "rspress_data")
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
	}

	return nil
}

func (service *DocService) UpdateBasicData(docId uint) error {
	doc, err := service.GetDocumentation(docId)
	if err != nil {
		return err
	}

	docConfigTemplate, err := utils.ReadEmbeddedFile("rspress.config.ts")

	if err != nil {
		return err
	}

	docPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data", "doc_"+strconv.Itoa(int(docId)))
	docConfig := filepath.Join(docPath, "rspress.config.ts")

	replacements := map[string]string{
		"__TITLE__":             doc.Name,
		"__TAG_LINE__":          doc.Description,
		"__BASE_URL__":          doc.BaseURL,
		"__FAVICON__":           "https://downloads-bucket.difuse.io/favicon-final-kalmia.ico",
		"__META_IMAGE__":        "img/meta.webp",
		"__NAVBAR_TITLE__":      doc.Name,
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
		markdown += blockToMarkdown(block, 0, nil)
	}

	top := "---\n"
	top += "pageType: doc\n"
	top += "footer: true\n"
	top += "title: " + title + "\n"
	top += "---\n"

	if strings.Contains(markdown, "ReactPlayer") {
		top += "import ReactPlayer from 'react-player'"
	}

	if top != "" {
		top += "\n\n"
	}

	return fmt.Sprintf("%s%s", top, markdown), nil
}

func blockToMarkdown(block Block, depth int, numbering *[]int) string {
	content := getTextContent(block.Content)
	styledContent := applyBlockStyles(content, block.Props, block.Type)

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
	case "table":
		tableContent, ok := block.Content.(map[string]interface{})
		if !ok {
			return "Invalid content for table"
		}
		return applyBlockStyles(tableToMarkdown(tableContent), block.Props, block.Type) + "\n"
	case "image":
		return imageToMarkdown(block.Props)
	case "video":
		return applyBlockStyles(videoToMarkdown(block.Props), block.Props, block.Type)
	case "audio":
		return applyBlockStyles(audioToMarkdown(block.Props), block.Props, block.Type)
	case "file":
		return applyBlockStyles(fileToMarkdown(block.Props), block.Props, block.Type)
	case "alert":
		return applyBlockStyles(alertToMarkdown(block.Props, styledContent), block.Props, block.Type)
	default:
		return ""
	}
}

func imageWithAlignment(url, alt, alignment, caption string) string {
	var containerClass, imageClass, captionClass string

	switch alignment {
	case "left", "flex-start":
		containerClass = "items-start"
		imageClass = "mr-auto"
		captionClass = "text-left mr-auto"
	case "right", "flex-end":
		containerClass = "items-end"
		imageClass = "ml-auto"
		captionClass = "text-right ml-auto"
	case "center", "":
		containerClass = "items-center"
		imageClass = "mx-auto"
		captionClass = "text-center mx-auto"
	default:
		containerClass = fmt.Sprintf("items-%s", alignment)
		imageClass = "mx-auto"
		captionClass = fmt.Sprintf("text-%s mx-auto", alignment)
	}

	return fmt.Sprintf(`
    <div className="flex flex-col w-full %s">
        <img
            src="%s"
            alt="%s"
            className="max-w-[640px] max-h-[360px] w-auto h-auto image-in-mdx %s"
        />
        <span className="%s">%s</span>
    </div>
    `, containerClass, url, alt, imageClass, captionClass, caption)
}

func imageToMarkdown(props map[string]interface{}) string {
	url, urlOK := props["url"].(string)
	caption, _ := props["caption"].(string)

	if !urlOK {
		return "\nInvalid image URL\n"
	}

	alignment := "flex-start"

	if textAlignment, ok := props["textAlignment"].(string); ok {
		if textAlignment == "left" {
			alignment = "flex-start"
		} else if textAlignment == "center" {
			alignment = "center"
		} else if textAlignment == "right" {
			alignment = "flex-end"
		}
	}

	return imageWithAlignment(url, caption, alignment, caption) + "\n\n"
}

func videoToMarkdown(props map[string]interface{}) string {
	url, urlOK := props["url"].(string)
	width, _ := props["previewWidth"].(float64)
	caption, _ := props["caption"].(string)

	if !urlOK {
		return "\nInvalid video URL\n"
	}

	return fmt.Sprintf("<figure style={{marginLeft:'0px'}}>\n<ReactPlayer playing controls url='%s' width='%dpx' />\n<figcaption style={{textAlign:'center'}}>%s</figcaption>\n</figure>\n", url, int(width), caption)
}

func fileToMarkdown(props map[string]interface{}) string {
	name, _ := props["name"].(string)
	url, urlOK := props["url"].(string)
	caption, _ := props["caption"].(string)

	if !urlOK {
		return "Invalid file URL"
	}

	return fmt.Sprintf("<figure>\n[%s](%s)\n<figcaption>%s</figcaption>\n</figure>\n", name, url, caption)
}

func audioToMarkdown(props map[string]interface{}) string {
	url, urlOK := props["url"].(string)
	caption, _ := props["caption"].(string)

	if !urlOK {
		return "\nInvalid audio URL\n"
	}

	return fmt.Sprintf("<figure style={{marginLeft:'0px'}}>\n<audio controls src='%s'>\nYour browser does not support the audio element.\n</audio>\n<figcaption style={{textAlign:'center'}}>%s</figcaption>\n</figure>\n", url, caption)
}

func alertToMarkdown(props map[string]interface{}, content string) string {
	alertType, _ := props["type"].(string)

	if alertType == "error" {
		alertType = "danger"
	}

	if alertType == "success" {
		alertType = `info SUCCESS`
	}

	return fmt.Sprintf("\n:::%s\n%s\n:::\n", alertType, content)
}

func tableToMarkdown(tableContent map[string]interface{}) string {
	// Assume this function handles table properties as earlier defined
	rowsInterface, ok := tableContent["rows"].([]interface{})
	if !ok {
		return "Invalid table data"
	}

	markdown := ""
	headers := []string{}
	separators := []string{}
	dataRows := []string{}

	for rowIndex, rowInterface := range rowsInterface {
		row, ok := rowInterface.(map[string]interface{})
		if !ok {
			continue
		}

		cellsInterface, ok := row["cells"].([]interface{})
		if !ok {
			continue
		}

		rowMarkdown := "|"
		for _, cellInterface := range cellsInterface {
			cell, ok := cellInterface.([]interface{})
			if !ok || len(cell) == 0 {
				rowMarkdown += " |"
				continue
			}

			cellMap, ok := cell[0].(map[string]interface{})
			if !ok {
				continue
			}

			text, ok := cellMap["text"].(string)
			if !ok {
				text = ""
			}

			rowMarkdown += " " + text + " |"
			if rowIndex == 0 {
				headers = append(headers, text)
				separators = append(separators, "---")
			}
		}

		if rowIndex == 0 {
			markdown += rowMarkdown + "\n|" + strings.Join(separators, "|") + "|\n"
		} else {
			dataRows = append(dataRows, rowMarkdown)
		}
	}

	for _, dataRow := range dataRows {
		markdown += dataRow + "\n"
	}

	return "\n" + markdown + "\n"
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
	checked := "[ ]" // default unchecke
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
	return fmt.Sprintf("\n%s\n", content)
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

func applyBlockStyles(content string, props map[string]interface{}, blockType string) string {
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

		if blockType != "image" && blockType != "video" {
			return fmt.Sprintf("<div style={%s}>%s</div>", styleString, content)
		}
	}

	if blockType == "image" {
		styleString := ""

		if len(style) > 0 {
			if _, ok := style["textAlign"]; !ok {
				style["textAlign"] = "center"
			}

			styleString = fmt.Sprintf("style={{ display: 'flex', justifyContent: '%s' }}", style["textAlign"])
		}

		return fmt.Sprintf("<div %s>\n%s</div>\n", styleString, content)
	}

	if blockType == "video" || blockType == "audio" {
		textAlignment, _ := props["textAlignment"].(string)
		customVideoStyle := fmt.Sprintf("display: 'flex', justifyContent: '%s', alignItems: '%s', textAlign: '%s', height: '100%%'", textAlignment, textAlignment, textAlignment)

		return fmt.Sprintf("<div style={{%s}}>\n%s</div>\n", customVideoStyle, content)
	}

	return content
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

		markdownExt := ".md"
		if strings.Contains(content, "import ReactPlayer from 'react-player'") || strings.Contains(content, "image-in-mdx") {
			markdownExt = ".mdx"
		}

		oppositeExt := ""

		if markdownExt == ".md" {
			oppositeExt = ".mdx"
			if utils.PathExists(filepath.Join(dirPath, "index"+oppositeExt)) {
				os.Remove(filepath.Join(dirPath, "index"+oppositeExt))
			}
		} else {
			oppositeExt = ".md"
		}

		if fullPage.IsIntroPage {
			fileName = "index" + markdownExt
		} else {
			fileName = utils.StringToFileString(fullPage.Title) + markdownExt
		}

		if utils.PathExists(filepath.Join(dirPath, utils.StringToFileString(fullPage.Title)+oppositeExt)) {
			err := os.Remove(filepath.Join(dirPath, utils.StringToFileString(fullPage.Title)+oppositeExt))
			if err != nil {
				return err
			}
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

	// Write _meta.json
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

func (service *DocService) WriteContents(docId uint) error {
	docIdPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data", "doc_"+strconv.Itoa(int(docId)))
	doc, err := service.GetDocumentation(docId)

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

	versionInfos := []VersionInfo{{Version: doc.Version, CreatedAt: *doc.CreatedAt, DocId: doc.ID}}
	childrenIds, err := service.GetChildrenOfDocumentation(docId)

	if err != nil {
		return err
	}

	for _, childId := range childrenIds {
		childDoc, err := service.GetDocumentation(childId)
		if err != nil {
			return err
		}
		versionInfos = append(versionInfos, VersionInfo{Version: childDoc.Version, CreatedAt: *childDoc.CreatedAt, DocId: childDoc.ID})
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

		/* example: versionedDocPath -> docs/1.0.0 */

		/* For Cleanup */
		var rootPageGroups []models.PageGroup

		if err := service.DB.Where("parent_id IS NULL AND documentation_id = ?", versionDoc.ID).Preload("Pages").Find(&rootPageGroups).Error; err != nil {
			return err
		}

		currentItems := make(map[string]bool)

		var addPageGroupToCurrentItems func(group models.PageGroup) error
		addPageGroupToCurrentItems = func(group models.PageGroup) error {
			groupName := utils.StringToFileString(group.Name)
			currentItems[groupName] = true

			pages, err := service.GetPagesOfPageGroup(group.ID)
			if err != nil {
				return err
			}
			for _, page := range pages {
				currentItems[utils.StringToFileString(page.Title)] = true
			}

			var nestedGroups []models.PageGroup
			if err := service.DB.Where("parent_id = ?", group.ID).Find(&nestedGroups).Error; err != nil {
				return err
			}
			for _, nestedGroup := range nestedGroups {
				if err := addPageGroupToCurrentItems(nestedGroup); err != nil {
					return err
				}
			}
			return nil
		}

		for _, page := range versionDoc.Pages {
			currentItems[utils.StringToFileString(page.Title)] = true
		}

		for _, group := range rootPageGroups {
			if err := addPageGroupToCurrentItems(group); err != nil {
				return err
			}
		}
		/* End Cleanup Stuff */
		/* Root of Version folder stuff */

		cleanedBase := utils.StringToFileString(versionDoc.BaseURL)

		var rootMeta string

		if versionDoc.LanderDetails != "" && versionDoc.LanderDetails != "{}" {
			rootMeta = fmt.Sprintf(`[{"text": "Home","link": "/%s/home","activeMatch": "/%s/home"}, {"text": "Documentation","link": "/%s/index","activeMatch": "/%s/"}]`, cleanedBase, cleanedBase, cleanedBase, cleanedBase)
		} else {
			rootMeta = fmt.Sprintf(`[{"text": "Documentation","link": "/%s/index","activeMatch": "/%s/"}`, cleanedBase, cleanedBase)
		}

		var customCSS strings.Builder

		customCSS.WriteString("@import 'tailwindcss/base';\n")
		customCSS.WriteString("@import 'tailwindcss/components';\n")
		customCSS.WriteString("@import 'tailwindcss/utilities';\n\n")

		if versionDoc.CustomCSS != "" {
			customCSS.WriteString(versionDoc.CustomCSS)
		}

		if err := utils.WriteToFile(filepath.Join(versionedDocPath, "../../", "styles", "input.css"), customCSS.String()); err != nil {
			return err
		}

		if err := utils.WriteToFile(filepath.Join(versionedDocPath, "_meta.json"), rootMeta); err != nil {
			return err
		}

		userContentPath := filepath.Join(versionedDocPath, utils.StringToFileString(versionDoc.BaseURL))

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

func removeOldContent(currentItems map[string]bool, dirPath string) error {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		fullPath := filepath.Join(dirPath, entry.Name())
		if entry.IsDir() {
			if _, exists := currentItems[entry.Name()]; !exists {
				if err := os.RemoveAll(fullPath); err != nil {
					return err
				}
			} else {
				if err := removeOldContent(currentItems, fullPath); err != nil {
					return err
				}
			}
		} else {
			if (entry.Name() == "index.mdx" || entry.Name() == "index.md" || entry.Name() == "home.mdx") && filepath.Dir(fullPath) == dirPath {
				continue
			}

			if entry.Name() == "_meta.json" {
				continue
			}

			baseNameMdx := strings.TrimSuffix(entry.Name(), ".mdx")
			baseNameMd := strings.TrimSuffix(entry.Name(), ".md")

			if _, exists := currentItems[baseNameMdx]; !exists {
				if err := os.Remove(fullPath); err != nil {
					return err
				}
			}

			if _, exists := currentItems[baseNameMd]; !exists {
				if err := os.Remove(fullPath); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func (service *DocService) WriteHomePage(documentation models.Documentation, contentPath string) error {
	var homePage string
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
	} else {
		homePage = fmt.Sprintf("<meta http-equiv=\"refresh\" content=\"0;url=%s\" />", documentation.BaseURL)
	}

	homePagePath := filepath.Join(contentPath, "../", "home.mdx")
	if err := utils.WriteToFile(homePagePath, homePage); err != nil {
		return err
	}
	return nil
}

func (service *DocService) DocusaurusBuild(docId uint) error {
	docPath := filepath.Join(config.ParsedConfig.DataPath, "rspress_data", "doc_"+strconv.Itoa(int(docId)))
	buildPath := filepath.Join(docPath, "build")
	tmpBuildPath := filepath.Join(docPath, "build_tmp")

	err := utils.RunNpxCommand(docPath, "tailwindcss", "build", "styles/input.css", "-o", "styles/output.css")

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

func (service *DocService) GetDocusaurus(urlPath string) (string, string, error) {
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
		return "", "", fmt.Errorf("docusaurus_build_not_found")
	}

	files, err := os.ReadDir(docPath)
	if err != nil {
		return "", "", fmt.Errorf("error_reading_docusaurus_directory")
	}

	if len(files) == 0 {
		return "", "", fmt.Errorf("docusaurus_build_empty")
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
