package utils

import (
	"strings"
)

// Block structure of JSON data
type Block struct {
	ID       string                 `json:"id"`
	Type     string                 `json:"type"`
	Props    map[string]interface{} `json:"props"`
	Content  interface{}            `json:"content"`
	Children []Block                `json:"children"`
}

func ParseMarkDownToBlocks(markdown string) ([]map[string]interface{}, error) {
	var blocks []map[string]interface{}
	lines := strings.Split(markdown, "\n")
	var parentBlock map[string]interface{} // For handling nested lists

	var tableLines []string // To accumulate table rows

	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)
		if trimmedLine == "" {
			// If we encounter an empty line, finalize any ongoing table parsing
			if len(tableLines) > 0 {
				tableBlock := parseTableBlock(tableLines)
				blocks = append(blocks, tableBlock)
				tableLines = nil // Reset tableLines
			}
			continue
		}

		var block map[string]interface{}
		switch {
		case strings.HasPrefix(trimmedLine, "#"):
			block = parseHeading(trimmedLine)
		case strings.HasPrefix(trimmedLine, "- [ ]") || strings.HasPrefix(trimmedLine, "- [x]"):
			block = parseCheckListItem(trimmedLine)
		case strings.HasPrefix(trimmedLine, "-"):
			block = parseBulletListItem(trimmedLine)
		case isNumberedList(trimmedLine):
			block = parseNumberedListItem(trimmedLine)
		case strings.HasPrefix(trimmedLine, "!["):
			block = parseMedia(trimmedLine)
		case strings.HasPrefix(trimmedLine, "**") && strings.HasSuffix(trimmedLine, "**"):
			block = parseAlert(trimmedLine)
		default:
			block = parseParagraph(trimmedLine)
		}

		// Finalize any ongoing table parsing before adding new blocks
		if len(tableLines) > 0 {
			tableBlock := parseTableBlock(tableLines)
			blocks = append(blocks, tableBlock)
			tableLines = nil // Reset tableLines
		}

		// Handle nested lists
		if block != nil {
			if parentBlock != nil && (block["type"] == "numberedListItem" || block["type"] == "bulletListItem") {
				children := parentBlock["children"].([]map[string]interface{})
				children = append(children, block)
				parentBlock["children"] = children
			} else {
				blocks = append(blocks, block)
				if block["type"] == "numberedListItem" || block["type"] == "bulletListItem" {
					block["children"] = []map[string]interface{}{}
					parentBlock = block
				} else {
					parentBlock = nil
				}
			}
		}
	}
	return blocks, nil
}

//******************** PARSING BLOCKS LOGIC ***********************//

// heading parsing
func parseHeading(line string) map[string]interface{} {
	level := strings.Count(line, "#")
	text := strings.TrimSpace(strings.TrimLeft(line, "#"))
	return createBlock("heading", map[string]interface{}{"level": level}, []map[string]interface{}{
		{"type": "text",
			"text":   text,
			"styles": map[string]interface{}{}},
	})
}

// check list parsing
func parseCheckListItem(line string) map[string]interface{} {
	checked := strings.HasPrefix(line, "- [x]")
	text := strings.TrimSpace(line[5:])
	return createBlock("checkListItem", map[string]interface{}{"checked": checked}, []map[string]interface{}{
		{"type": "text",
			"text":   text,
			"styles": map[string]interface{}{}},
	})
}

// bullet list parsing
func parseBulletListItem(line string) map[string]interface{} {
	text := strings.TrimSpace(strings.TrimPrefix(line, "-"))
	return createBlock("bulletListItem", nil, []map[string]interface{}{
		{"type": "text",
			"text":   text,
			"styles": map[string]interface{}{}},
	})
}

// numbered list parsing
func parseNumberedListItem(line string) map[string]interface{} {
	parts := strings.SplitN(line, ".", 2)
	text := strings.TrimSpace(parts[1])
	return createBlock("numberedListItem", nil, []map[string]interface{}{
		{"type": "text",
			"text":   text,
			"styles": map[string]interface{}{}},
	})
}

// paragraph parsing
func parseParagraph(line string) map[string]interface{} {
	if strings.HasPrefix(line, "![") {
		return nil
	}
	return createBlock("paragraph", nil, []map[string]interface{}{
		{"type": "text",
			"text":   line,
			"styles": map[string]interface{}{}},
	})
}

// media parsing
func parseMedia(line string) map[string]interface{} {
	if !strings.HasPrefix(line, "![") {
		return nil // Not a valid media block
	}

	// Extract the caption (text inside square brackets)
	captionStart := strings.Index(line, "[") + 1
	captionEnd := strings.Index(line, "]")
	caption := line[captionStart:captionEnd]

	// Extract the URL (text inside parentheses)
	urlStart := strings.Index(line, "(") + 1
	urlEnd := strings.Index(line, ")")
	urlAndTitle := line[urlStart:urlEnd]
	// Extract URL and optional title
	urlParts := strings.Split(urlAndTitle, `"`)
	url := strings.TrimSpace(urlParts[0])
	var name string
	if len(urlParts) > 1 {
		name = strings.TrimSpace(urlParts[1])
	} else {
		name = ""
	}
	// Determine media type based on file extension
	var mediaType string
	if strings.HasSuffix(url, ".mp3") || strings.HasSuffix(url, ".wav") || strings.HasSuffix(url, ".ogg") {
		mediaType = "audio"
	} else if strings.HasSuffix(url, ".webm") || strings.HasSuffix(url, ".mp4") {
		mediaType = "video"
	} else {
		mediaType = "image"
	}

	// Create the media block
	return createMediaBlock(name, mediaType, url, caption)
}

// alert parsing
func parseAlert(line string) map[string]interface{} {
	if strings.HasPrefix(line, "**") && strings.HasSuffix(line, "**") {
		alertType := strings.Trim(line, "*")
		alertType = strings.ToLower(alertType)

		// Define allowed alert types
		validAlerts := map[string]string{
			"warning":     "warning",
			"danger":      "danger",
			"informative": "info",
			"success":     "success",
		}

		// Validate the extracted alert type
		alertKey, ok := validAlerts[alertType]
		if !ok {
			return nil // Skip if the alert type is invalid
		}

		// Create the alert block
		return createBlock("alert", map[string]interface{}{
			"type":          alertKey,
			"textColor":     "default",
			"textAlignment": "left",
		}, []map[string]interface{}{
			{
				"type":   "text",
				"text":   strings.Title(alertType), // Capitalize for display
				"styles": map[string]interface{}{"bold": true},
			},
		})
	}
	return nil
}

// Table Parsing
func parseTableBlock(tableLines []string) map[string]interface{} {
	var rows []map[string]interface{}
	for _, line := range tableLines {
		cells := strings.Split(line, "|")
		var rowCells []map[string]interface{}
		for _, cell := range cells {
			text := strings.TrimSpace(cell)
			if text != "" && text != "-------" { // Ignore empty cells and cells with "-------"
				rowCells = append(rowCells, map[string]interface{}{
					"type":   "text",
					"text":   text,
					"styles": map[string]interface{}{},
				})
			}
		}
		if len(rowCells) > 0 { // Add row only if it has valid cells
			rows = append(rows, map[string]interface{}{
				"cells": rowCells,
			})
		}
	}

	// Create the table block
	return createBlock("table", map[string]interface{}{
		"textColor":       "default",
		"backgroundColor": "default",
	}, map[string]interface{}{
		"type": "tableContent",
		"rows": rows,
	})

}

//****************************************************//

// -- Utility to create a block with default structure
func createBlock(blockType string, props map[string]interface{}, content interface{}) map[string]interface{} {
	if props == nil {
		props = DefaultProps()
	}
	return map[string]interface{}{
		"id":       GenerateID(),
		"type":     blockType,
		"props":    props,
		"content":  content,
		"children": []map[string]interface{}{},
	}
}

// -- Utility to set Default properties for default props
func DefaultProps() map[string]interface{} {
	return map[string]interface{}{
		"textColor":       "default",
		"backgroundColor": "default",
		"textAlignment":   "left",
	}
}

// -- Utility to create media properties for media block
func createMediaBlock(name, mediaType, url, caption string) map[string]interface{} {
	// Default preview width

	previewWidth := 512 // Default width for non-audio media

	if mediaType == "video" {
		previewWidth = 240 // Default for video
	}

	return map[string]interface{}{
		"id":   GenerateID(),
		"type": mediaType, // Could also handle "video" or "audio" if extended
		"props": map[string]interface{}{
			"backgroundColor": "default",
			"textAlignment":   "center",
			"textColor":       "default",
			"name":            name,
			"url":             url,
			"caption":         caption,
			"showPreview":     true,
			"previewWidth":    previewWidth,
		},
		"children": []map[string]interface{}{}, // Media blocks typically don't have children
	}
}

// *** Helper function for type detection ***//
func isNumberedList(line string) bool {
	return len(line) > 1 && line[0] >= '0' && line[0] <= '9' && line[1] == '.'
}
