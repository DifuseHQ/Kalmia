package utils

import (
	"testing"
)

func TestBlockToMarkdown(t *testing.T) {
	tests := []struct {
		name     string
		block    Block
		expected string
	}{
		{
			name: "Heading",
			block: Block{
				Type: "heading",
				Props: map[string]interface{}{
					"level": float64(2),
				},
				Content: "Test Heading",
			},
			expected: "## Test Heading\n\n",
		},
		{
			name: "Numbered List Item",
			block: Block{
				Type:    "numberedListItem",
				Content: "Test Item",
			},
			expected: "1. Test Item\n",
		},
		{
			name: "Bullet List Item",
			block: Block{
				Type:    "bulletListItem",
				Content: "Test Item",
			},
			expected: "* Test Item\n",
		},
		{
			name: "Check List Item (Unchecked)",
			block: Block{
				Type:    "checkListItem",
				Content: "Test Item",
				Props: map[string]interface{}{
					"checked": false,
				},
			},
			expected: "- [ ] Test Item\n",
		},
		{
			name: "Check List Item (Checked)",
			block: Block{
				Type:    "checkListItem",
				Content: "Test Item",
				Props: map[string]interface{}{
					"checked": true,
				},
			},
			expected: "- [x] Test Item\n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := BlockToMarkdown(tt.block, 0, nil)
			if result != tt.expected {
				t.Errorf("BlockToMarkdown() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestHeadingToMarkdown(t *testing.T) {
	tests := []struct {
		name     string
		block    Block
		expected string
	}{
		{
			name: "H1",
			block: Block{
				Props:   map[string]interface{}{"level": float64(1)},
				Content: "Heading 1",
			},
			expected: "# Heading 1\n\n",
		},
		{
			name: "H3",
			block: Block{
				Props:   map[string]interface{}{"level": float64(3)},
				Content: "Heading 3",
			},
			expected: "### Heading 3\n\n",
		},
		{
			name: "Invalid Level",
			block: Block{
				Props:   map[string]interface{}{"level": float64(7)},
				Content: "Invalid Heading",
			},
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := HeadingToMarkdown(tt.block)
			if result != tt.expected {
				t.Errorf("HeadingToMarkdown() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestProcodeToMarkdown(t *testing.T) {
	tests := []struct {
		name     string
		props    map[string]interface{}
		expected string
	}{
		{
			name: "Python Code",
			props: map[string]interface{}{
				"code":     "print('Hello, World!')",
				"language": "python",
			},
			expected: "```python\nprint('Hello, World!')\n```\n",
		},
		{
			name: "Go Code",
			props: map[string]interface{}{
				"code":     "fmt.Println(\"Hello, World!\")",
				"language": "go",
			},
			expected: "```go\nfmt.Println(\"Hello, World!\")\n```\n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ProcodeToMarkdown(tt.props)
			if result != tt.expected {
				t.Errorf("ProcodeToMarkdown() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestGetTextContent(t *testing.T) {
	tests := []struct {
		name     string
		content  interface{}
		expected string
	}{
		{
			name:     "Simple String",
			content:  "Hello, World!",
			expected: "Hello, World!",
		},
		{
			name: "Complex Content",
			content: []interface{}{
				map[string]interface{}{
					"text": "Hello, ",
					"styles": map[string]interface{}{
						"bold": true,
					},
				},
				map[string]interface{}{
					"text": "World!",
					"styles": map[string]interface{}{
						"italic": true,
					},
				},
			},
			expected: "<span style={{ fontWeight: 'bold' }}>Hello, </span><span style={{ fontStyle: 'italic' }}>World!</span>",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetTextContent(tt.content)
			if result != tt.expected {
				t.Errorf("GetTextContent() = %v, want %v", result, tt.expected)
			}
		})
	}
}
