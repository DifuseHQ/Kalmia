package utils

import (
	"fmt"
	"strings"
)

type Block struct {
	Type     string                 `json:"type"`
	Props    map[string]interface{} `json:"props"`
	Content  interface{}            `json:"content"`
	Children []Block                `json:"children"`
}

func ProcodeToMarkdown(props map[string]interface{}) string {
	code := props["code"].(string)
	language := props["language"].(string)
	return fmt.Sprintf("```%s\n%s\n```\n", code, language)
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

func ImageToMarkdown(props map[string]interface{}) string {
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

func VideoToMarkdown(props map[string]interface{}) string {
	url, urlOK := props["url"].(string)
	width, _ := props["previewWidth"].(float64)
	caption, _ := props["caption"].(string)

	if !urlOK {
		return "\nInvalid video URL\n"
	}

	return fmt.Sprintf("<figure style={{marginLeft:'0px'}}>\n<ReactPlayer playing controls url='%s' width='%dpx' />\n<figcaption style={{textAlign:'center'}}>%s</figcaption>\n</figure>\n", url, int(width), caption)
}

func FileToMarkdown(props map[string]interface{}) string {
	name, _ := props["name"].(string)
	url, urlOK := props["url"].(string)
	caption, _ := props["caption"].(string)

	if !urlOK {
		return "Invalid file URL"
	}

	return fmt.Sprintf("<figure>\n[%s](%s)\n<figcaption>%s</figcaption>\n</figure>\n", name, url, caption)
}

func AudioToMarkdown(props map[string]interface{}) string {
	url, urlOK := props["url"].(string)
	caption, _ := props["caption"].(string)

	if !urlOK {
		return "\nInvalid audio URL\n"
	}

	return fmt.Sprintf("<figure style={{marginLeft:'0px'}}>\n<audio controls src='%s'>\nYour browser does not support the audio element.\n</audio>\n<figcaption style={{textAlign:'center'}}>%s</figcaption>\n</figure>\n", url, caption)
}

func AlertToMarkdown(props map[string]interface{}, content string) string {
	alertType, _ := props["type"].(string)

	if alertType == "error" {
		alertType = "danger"
	}

	if alertType == "success" {
		alertType = `info SUCCESS`
	}

	return fmt.Sprintf("\n:::%s\n%s\n:::\n", alertType, content)
}

func TableToMarkdown(tableContent map[string]interface{}) string {
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

func GetTextContent(content interface{}) string {
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

func ApplyBlockStyles(content string, props map[string]interface{}, blockType string) string {
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

func ParagraphToMarkdown(content string) string {
	return fmt.Sprintf("\n%s\n", content)
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
		markdown += BlockToMarkdown(child, depth+1, numbering)
	}

	return markdown
}

func BlockToMarkdown(block Block, depth int, numbering *[]int) string {
	content := GetTextContent(block.Content)
	styledContent := ApplyBlockStyles(content, block.Props, block.Type)

	switch block.Type {
	case "heading":
		level, _ := block.Props["level"].(float64)
		return fmt.Sprintf("%s %s\n\n", strings.Repeat("#", int(level)), styledContent)
	case "paragraph":
		return ParagraphToMarkdown(styledContent)
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
		return ApplyBlockStyles(TableToMarkdown(tableContent), block.Props, block.Type) + "\n"
	case "image":
		return ImageToMarkdown(block.Props)
	case "video":
		return ApplyBlockStyles(VideoToMarkdown(block.Props), block.Props, block.Type)
	case "audio":
		return ApplyBlockStyles(AudioToMarkdown(block.Props), block.Props, block.Type)
	case "file":
		return ApplyBlockStyles(FileToMarkdown(block.Props), block.Props, block.Type)
	case "alert":
		return ApplyBlockStyles(AlertToMarkdown(block.Props, styledContent), block.Props, block.Type)
	case "procode":
		return ProcodeToMarkdown(block.Props)
	default:
		return ""
	}
}

func bulletListItemToMarkdown(block Block, depth int, content string) string {
	indent := strings.Repeat("    ", depth)
	markdown := fmt.Sprintf("%s* %s\n", indent, content)
	for _, child := range block.Children {
		markdown += BlockToMarkdown(child, depth+1, nil)
	}

	return markdown
}

func checkListItemToMarkdown(block Block, depth int, content string) string {
	indent := strings.Repeat("    ", depth)
	checked := "[ ]"
	if isChecked, ok := block.Props["checked"].(bool); ok && isChecked {
		checked = "[x]"
	}

	markdown := fmt.Sprintf("%s- %s %s\n", indent, checked, content)

	for _, child := range block.Children {
		markdown += BlockToMarkdown(child, depth+1, nil)
	}

	return markdown
}
