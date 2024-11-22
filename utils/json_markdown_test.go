package utils

import (
	"testing"
)

func TestApplyTextStyles(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		styles   map[string]interface{}
		expected string
	}{
		{
			name:     "No styles",
			text:     "Sample text",
			styles:   map[string]interface{}{},
			expected: "Sample text",
		},
		{
			name: "Bold style",
			text: "Bold text",
			styles: map[string]interface{}{
				"bold": true,
			},
			expected: "<span style={{ fontWeight: 'bold' }}>Bold text</span>",
		},
		{
			name: "Multiple styles",
			text: "Styled text",
			styles: map[string]interface{}{
				"bold":      true,
				"italic":    true,
				"underline": true,
			},
			expected: "<span style={{ fontWeight: 'bold', fontStyle: 'italic', textDecoration: 'underline' }}>Styled text</span>",
		},
		{
			name: "Color styles",
			text: "Colored text",
			styles: map[string]interface{}{
				"textColor":       "red",
				"backgroundColor": "yellow",
			},
			expected: "<span style={{ color: 'red', backgroundColor: 'yellow' }}>Colored text</span>",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ApplyTextStyles(tt.text, tt.styles)
			if result != tt.expected {
				t.Errorf("applyTextStyles() got = %v, want %v", result, tt.expected)
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

func TestHeadingToMarkdown(t *testing.T) {
	tests := []struct {
		name     string
		block    Block
		expected string
	}{
		{
			name: "Valid Heading Level 1",
			block: Block{
				Props:   map[string]interface{}{"level": float64(1)},
				Content: "Heading One",
			},
			expected: "# Heading One\n\n",
		},
		{
			name: "Valid Heading Level 3",
			block: Block{
				Props:   map[string]interface{}{"level": float64(3)},
				Content: "Heading Three",
			},
			expected: "### Heading Three\n\n",
		},
		{
			name: "Invalid Heading Level 0",
			block: Block{
				Props:   map[string]interface{}{"level": float64(0)},
				Content: "Invalid Level",
			},
			expected: "",
		},
		{
			name: "Invalid Heading Level 7",
			block: Block{
				Props:   map[string]interface{}{"level": float64(7)},
				Content: "Invalid Level",
			},
			expected: "",
		},
		{
			name: "Non-integer Level",
			block: Block{
				Props:   map[string]interface{}{"level": "three"},
				Content: "Non-integer Level",
			},
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := HeadingToMarkdown(tt.block)
			if result != tt.expected {
				t.Errorf("HeadingToMarkdown() got = %v, want %v", result, tt.expected)
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
			name: "Valid Code Block with Language",
			props: map[string]interface{}{
				"code":     "fmt.Println(\"Hello, world!\")",
				"language": "go",
			},
			expected: "```go\nfmt.Println(\"Hello, world!\")\n```\n",
		},
		{
			name: "Valid Code Block without Language",
			props: map[string]interface{}{
				"code": "print(\"Hello, world!\")",
			},
			expected: "```\nprint(\"Hello, world!\")\n```\n",
		},
		{
			name:     "Missing Code",
			props:    map[string]interface{}{},
			expected: "",
		},
		{
			name: "Invalid Code Type",
			props: map[string]interface{}{
				"code": 123,
			},
			expected: "",
		},
		{
			name: "Invalid Language Type",
			props: map[string]interface{}{
				"code":     "echo 'Hello, world!';",
				"language": 123,
			},
			expected: "```\necho 'Hello, world!';\n```\n", // Still defaults to generic block
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ProcodeToMarkdown(tt.props)
			if result != tt.expected {
				t.Errorf("ProcodeToMarkdown() got = %v, want %v", result, tt.expected)
			}
		})
	}
}
