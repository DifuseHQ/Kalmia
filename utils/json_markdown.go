package utils

import (
	"encoding/json"
	"fmt"
	"strings"
)

type Block struct {
	ID       string                 `json:"id"`
	Type     string                 `json:"type"`
	Props    map[string]interface{} `json:"props"`
	Content  interface{}            `json:"content"`
	Children []Block                `json:"children"`
}

func ApplyTextStyles(text string, styles map[string]interface{}) string {
	jsxStyles := make([]string, 0)

	if bold, ok := styles["bold"].(bool); ok && bold {
		jsxStyles = append(jsxStyles, "fontWeight: 'bold'")
	}

	if italic, ok := styles["italic"].(bool); ok && italic {
		jsxStyles = append(jsxStyles, "fontStyle: 'italic'")
	}

	if underline, ok := styles["underline"].(bool); ok && underline {
		jsxStyles = append(jsxStyles, "textDecoration: 'underline'")
	}

	if strike, ok := styles["strike"].(bool); ok && strike {
		jsxStyles = append(jsxStyles, "textDecoration: 'line-through'")
	}

	if textColor, ok := styles["textColor"].(string); ok {
		jsxStyles = append(jsxStyles, fmt.Sprintf("color: '%s'", textColor))
	}

	if bgColor, ok := styles["backgroundColor"].(string); ok {
		jsxStyles = append(jsxStyles, fmt.Sprintf("backgroundColor: '%s'", bgColor))
	}

	if len(jsxStyles) > 0 {
		text = fmt.Sprintf("<span style={{ %s }}>%s</span>", strings.Join(jsxStyles, ", "), text)
	}

	return text
}

func GetTextContent(content interface{}) string {
	switch v := content.(type) {
	case []interface{}:
		var builder strings.Builder
		for _, item := range v {
			if contentItem, ok := item.(map[string]interface{}); ok {
				if text, ok := contentItem["text"].(string); ok {
					if styles, ok := contentItem["styles"].(map[string]interface{}); ok {
						text = ApplyTextStyles(text, styles)
					}
					builder.WriteString(text)
				}
			}
		}
		return builder.String()
	case string:
		return v
	default:
		return ""
	}
}

func ProcodeToMarkdown(props map[string]interface{}) string {
	code, ok := props["code"].(string)
	if !ok {
		return ""
	}

	language, ok := props["language"].(string)
	if !ok {
		language = ""
	}

	if language != "" {
		return fmt.Sprintf("```%s\n%s\n```\n", language, code)
	} else {
		return fmt.Sprintf("```\n%s\n```\n", code)
	}
}

func BlockToMDX(block Block) string {
	blockJson, err := json.Marshal(block)
	if err != nil {
		return ""
	}

	jsonString := strings.Replace(string(blockJson), "`", "\\`", -1)
	componentName := block.Type
	componentName = strings.ToUpper(componentName[:1]) + componentName[1:]
	componentString := fmt.Sprintf(`<%s rawJson={%s} />`, componentName, jsonString)

	return componentString + "\n"
}

func BlockToMarkdown(block Block, depth int, numbering *[]int) string {
	content := GetTextContent(block.Content)
	styledContent := ApplyBlockStyles(content, block.Props, block.Type)

	switch block.Type {
	case "heading":
		return HeadingToMarkdown(block)
	case "checkListItem":
		return checkListItemToMarkdown(block, depth, styledContent)
	case "procode":
		return ProcodeToMarkdown(block.Props)
	case "paragraph", "table", "image", "video", "audio", "file", "alert", "numberedListItem", "bulletListItem":
		return BlockToMDX(block)
	default:
		return ""
	}
}

func HeadingToMarkdown(block Block) string {
	props := block.Props
	text := GetTextContent(block.Content)

	level, ok := props["level"].(float64)
	if !ok {
		if levelInt, ok := props["level"].(int); ok {
			level = float64(levelInt)
		} else {
			return ""
		}
	}

	if level < 1 || level > 6 {
		return ""
	}

	return fmt.Sprintf("%s %s\n\n", strings.Repeat("#", int(level)), text)
}

func ParagraphToMDX(block Block) string {
	blockJson, err := json.Marshal(block)
	if err != nil {
		return ""
	}

	jsonString := strings.Replace(string(blockJson), "`", "\\`", -1)
	componentString := fmt.Sprintf(`<Paragraph rawJson={%s} />`, jsonString)

	return componentString + "\n"
}

func ListToMDX(blocks []Block) string {
	listJson, err := json.Marshal(blocks)
	if err != nil {
		return ""
	}

	jsonString := strings.Replace(string(listJson), "`", "\\`", -1)
	componentString := fmt.Sprintf(`<List rawJson={%s} />`, jsonString)

	return componentString + "\n"
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
