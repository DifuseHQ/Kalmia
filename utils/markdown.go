package utils

import (
	"fmt"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"golang.org/x/net/html"
)

func ProcessHTML(node ast.Node, source []byte, output *strings.Builder) error {
	for child := node.FirstChild(); child != nil; child = child.NextSibling() {
		switch n := child.(type) {
		case *ast.RawHTML: // Handle raw HTML
			rawHTML := string(n.Text(source))
			elementType, srcPath, caption, ok := ExtractAssetFromHTML(rawHTML)
			if ok {
				// Convert specific HTML elements to Markdown
				switch elementType {
				case "img":
					output.WriteString(fmt.Sprintf("![%s](%s)\n", caption, srcPath))
				case "video", "audio":
					output.WriteString(fmt.Sprintf("[%s](%s)\n", caption, srcPath))
				case "figure":
					output.WriteString(fmt.Sprintf("![%s](%s)\n", caption, srcPath))
				}
			} else {
				// Keep raw HTML if not matching
				output.WriteString(rawHTML)
			}
		default: // Render Markdown elements as-is
			if err := goldmark.DefaultRenderer().Render(output, source, n); err != nil {
				return fmt.Errorf("error rendering markdown: %v", err)
			}
		}
	}
	return nil
}

func ExtractAssetFromHTML(content string) (string, string, string, bool) {
	doc, err := html.Parse(strings.NewReader(content))
	if err != nil {
		return "", "", "", false
	}

	var srcPath, elementType, caption string
	var f func(n *html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode {
			switch n.Data {
			case "img", "audio", "video":
				for _, attr := range n.Attr {
					if attr.Key == "src" {
						srcPath = attr.Val
						elementType = n.Data
					}
				}
			case "figcaption":
				var buf strings.Builder
				for c := n.FirstChild; c != nil; c = c.NextSibling {
					if c.Type == html.TextNode {
						buf.WriteString(c.Data)
					}
				}
				caption = buf.String()
			}
		}

		// Recurse through child nodes
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}

	f(doc)

	if srcPath != "" {
		return elementType, srcPath, caption, true
	}

	return "", "", "", false
}
