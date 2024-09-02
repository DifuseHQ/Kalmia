package utils

import (
	"fmt"
	"net/url"
	"testing"
	"time"
)

func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
	}{
		{"Empty password", ""},
		{"Short password", "123"},
		{"Normal password", "password123"},
		{"Long password", "this_is_a_very_long_password_that_exceeds_32_characters"},
		{"Password with special characters", "p@ssw0rd!@#$%^&*()"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hashedPassword, err := HashPassword(tt.password)
			if err != nil {
				t.Errorf("HashPassword() error = %v", err)
				return
			}

			if hashedPassword == "" {
				t.Error("HashPassword() returned an empty string")
			}

			if hashedPassword == tt.password {
				t.Error("HashPassword() returned the same string as input")
			}

			if !CheckPasswordHash(tt.password, hashedPassword) {
				t.Error("CheckPasswordHash() failed to verify the hashed password")
			}
		})
	}
}

func TestCheckPasswordHash(t *testing.T) {
	password := "test_password"
	hashedPassword, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}

	tests := []struct {
		name           string
		password       string
		hashedPassword string
		want           bool
	}{
		{"Correct password", password, hashedPassword, true},
		{"Incorrect password", "wrong_password", hashedPassword, false},
		{"Empty password", "", hashedPassword, false},
		{"Empty hash", password, "", false},
		{"Both empty", "", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := CheckPasswordHash(tt.password, tt.hashedPassword); got != tt.want {
				t.Errorf("CheckPasswordHash() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestHashPassword_Consistency(t *testing.T) {
	password := "test_password"

	hash1, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}

	hash2, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}

	if hash1 == hash2 {
		t.Error("HashPassword() produced identical hashes for the same password")
	}

	if !CheckPasswordHash(password, hash1) {
		t.Error("CheckPasswordHash() failed for hash1")
	}

	if !CheckPasswordHash(password, hash2) {
		t.Error("CheckPasswordHash() failed for hash2")
	}
}

func TestToLowerCase(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"Empty string", "", ""},
		{"Already lowercase", "hello world", "hello world"},
		{"Mixed case", "HeLLo WoRLd", "hello world"},
		{"All uppercase", "HELLO WORLD", "hello world"},
		{"With numbers", "Hello123World", "hello123world"},
		{"With special characters", "HeLLo@WoRLd!", "hello@world!"},
		{"Non-ASCII characters", "HéLLö WörLD", "héllö wörld"},
		{"Very long string", "THIS IS A VERY LONG STRING THAT EXCEEDS THIRTY-TWO CHARACTERS IN LENGTH", "this is a very long string that exceeds thirty-two characters in length"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ToLowerCase(tt.input)
			if result != tt.expected {
				t.Errorf("ToLowerCase(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestToLowerCase_Idempotence(t *testing.T) {
	input := "HeLLo WoRLd"
	firstResult := ToLowerCase(input)
	secondResult := ToLowerCase(firstResult)

	if firstResult != secondResult {
		t.Errorf("ToLowerCase is not idempotent: ToLowerCase(%q) != ToLowerCase(ToLowerCase(%q))", input, input)
	}
}

func TestRemoveSpaces(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"hello world", "helloworld"},
		{"  spaces  ", "spaces"},
		{"noSpaces", "noSpaces"},
		{" multiple   spaces ", "multiplespaces"},
	}

	for _, test := range tests {
		result := RemoveSpaces(test.input)
		if result != test.expected {
			t.Errorf("RemoveSpaces(%q) = %q; expected %q", test.input, result, test.expected)
		}
	}
}

func TestStringToUint(t *testing.T) {
	tests := []struct {
		input     string
		expected  uint
		expectErr bool
	}{
		{"123", 123, false},
		{"0", 0, false},
		{"4294967295", 4294967295, false}, // Max value for uint32, should not error
		{"4294967296", 0, true},           // Exceeds uint32 range
		{"-1", 0, true},                   // Negative number
		{"abc", 0, true},                  // Non-numeric string
	}

	for _, test := range tests {
		result, err := StringToUint(test.input)
		if (err != nil) != test.expectErr {
			t.Errorf("StringToUint(%q) error = %v; expected error = %v", test.input, err, test.expectErr)
			continue
		}
		if result != test.expected {
			t.Errorf("StringToUint(%q) = %d; expected %d", test.input, result, test.expected)
		}
	}
}

func TestStringToFileString(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Hello World!", "hello-world"},
		{"  Multiple   spaces  ", "multiple-spaces"},
		{"Special_chars!@#$%", "special-chars"},
		{"A very long string that should be truncated to fit within fifty characters.", "a-very-long-string-that-should-be-truncated-to-fit"},
		{"", "unnamed-file"},
		{"         ", "unnamed-file"},
	}

	for _, test := range tests {
		result := StringToFileString(test.input)
		escapedExpected := url.PathEscape(test.expected)
		if result != escapedExpected {
			t.Errorf("StringToFileString(%q) = %q; expected %q", test.input, result, escapedExpected)
		}
	}
}

func TestUintPtr(t *testing.T) {
	tests := []struct {
		input    uint
		expected uint
	}{
		{0, 0},
		{1, 1},
		{12345, 12345},
	}

	for _, test := range tests {
		result := UintPtr(test.input)
		if *result != test.expected {
			t.Errorf("UintPtr(%d) = %d; expected %d", test.input, *result, test.expected)
		}
	}
}

func TestTimePtr(t *testing.T) {
	testCases := []struct {
		name string
		time time.Time
	}{
		{
			name: "Current time",
			time: time.Now(),
		},
		{
			name: "Zero time",
			time: time.Time{},
		},
		{
			name: "Specific time",
			time: time.Date(2023, 8, 15, 14, 30, 0, 0, time.UTC),
		},
		{
			name: "Max time",
			time: time.Unix(1<<63-62135596801, 999999999),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := TimePtr(tc.time)

			if result == nil {
				t.Fatal("Expected a non-nil result, got nil")
			}

			if *result != tc.time {
				t.Errorf("Expected %v, got %v", tc.time, *result)
			}
		})
	}
}

func TestReplaceMany(t *testing.T) {
	tests := []struct {
		input        string
		replacements map[string]string
		expected     string
	}{
		{
			input:        "hello world",
			replacements: map[string]string{"hello": "hi", "world": "earth"},
			expected:     "hi earth",
		},
		{
			input:        "a quick brown fox",
			replacements: map[string]string{"quick": "slow", "fox": "dog"},
			expected:     "a slow brown dog",
		},
		{
			input:        "hello hello",
			replacements: map[string]string{"hello": "hi"},
			expected:     "hi hi",
		},
		{
			input:        "no replacements",
			replacements: map[string]string{"foo": "bar"},
			expected:     "no replacements",
		},
		{
			input:        "",
			replacements: map[string]string{"foo": "bar"},
			expected:     "",
		},
	}

	for _, test := range tests {
		result := ReplaceMany(test.input, test.replacements)
		if result != test.expected {
			t.Errorf("ReplaceMany(%q, %v) = %q; expected %q", test.input, test.replacements, result, test.expected)
		}
	}
}

func TestIsBaseURLValid(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected bool
	}{
		// Invalid cases (exact matches with different slash combinations)
		{"Admin no slashes", "admin", false},
		{"Admin leading slash", "/admin", false},
		{"Admin trailing slash", "admin/", false},
		{"Admin both slashes", "/admin/", false},
		{"Docs no slashes", "docs", false},
		{"Docs leading slash", "/docs", false},
		{"Docs trailing slash", "docs/", false},
		{"Docs both slashes", "/docs/", false},
		{"Auth no slashes", "auth", false},
		{"Auth leading slash", "/auth", false},
		{"Auth trailing slash", "auth/", false},
		{"Auth both slashes", "/auth/", false},
		{"OAuth no slashes", "oauth", false},
		{"OAuth leading slash", "/oauth", false},
		{"OAuth trailing slash", "oauth/", false},
		{"OAuth both slashes", "/oauth/", false},
		{"Health no slashes", "health", false},
		{"Health leading slash", "/health", false},
		{"Health trailing slash", "health/", false},
		{"Health both slashes", "/health/", false},

		// Case insensitivity tests
		{"Uppercase ADMIN", "ADMIN", false},
		{"Mixed case AdMiN", "AdMiN", false},
		{"Uppercase DOCS", "DOCS", false},
		{"Uppercase AUTH", "AUTH", false},
		{"Uppercase OAUTH", "OAUTH", false},
		{"Uppercase HEALTH", "HEALTH", false},

		// Special cases
		{"Empty string", "", false},
		{"Single slash", "/", false},

		// Valid cases
		{"Valid path api", "/api", true},
		{"Valid path users", "/users", true},
		{"Valid path products", "/products", true},
		{"Valid nested path", "/api/v1/users", true},

		// Edge cases (similar to invalid but should be valid)
		{"Admin substring", "administrator", true},
		{"Admin in path", "/api/admin", true},
		{"Docs substring", "/documents", true},
		{"Auth substring", "/authorize", true},
		{"OAuth substring", "/oauth2", true},
		{"Health substring", "/healthcare", true},

		// Additional edge cases
		{"Leading and trailing spaces", "  /api  ", true},
		{"Multiple slashes", "//api///v1////users", true},
		{"Very long path", "/this/is/a/very/long/path/that/should/still/be/valid", true},
		{"Path with numbers", "/api/v1/user123", true},
		{"Path with special characters", "/api/v1/user-name_@123", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := IsBaseURLValid(tc.input)
			if result != tc.expected {
				t.Errorf("IsBaseURLValid(%q) = %v, want %v", tc.input, result, tc.expected)
			}
		})
	}
}

func TestIsBaseURLValid_EdgeCases(t *testing.T) {
	edgeCases := []struct {
		input    string
		expected bool
	}{
		{"admin", false},
		{"/admin", false},
		{"admin/", false},
		{"/admin/", false},
		{"docs", false},
		{"/docs", false},
		{"docs/", false},
		{"/docs/", false},
		{"auth", false},
		{"/auth", false},
		{"auth/", false},
		{"/auth/", false},
		{"oauth", false},
		{"/oauth", false},
		{"oauth/", false},
		{"/oauth/", false},
		{"health", false},
		{"/health", false},
		{"health/", false},
		{"/health/", false},
		{"", false},
		{"/", false},
		{"adminz", true},
		{"/admins", true},
		{"/administrator", true},
		{"/adm", true},
		{"/docs_", true},
		{"/authentication", true},
		{"/authorize", true},
		{"/healthcheck", true},
		{"/health_check", true},
		{"/admin_panel", true},
		{"/my_oauth", true},
		{"/custom/path", true},
		{"/api/admin", true},
		{"/oauth/token", true},
		{"/health/check", true},
		{"/admin/users", true},
		{"/AUTH", false},
		{"/DocS", false},
		{"/HEALTH", false},
		{"/oauth2", true},
		{"/healthy", true},
		{"/administrator", true},
		{"/doc", true},
		{"/authorization", true},
	}

	for _, tt := range edgeCases {
		t.Run(fmt.Sprintf("Edge case: %s", tt.input), func(t *testing.T) {
			result := IsBaseURLValid(tt.input)
			if result != tt.expected {
				t.Errorf("IsBaseURLValid(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestIsBaseURLValid_CaseSensitivity(t *testing.T) {
	caseSensitiveCases := []struct {
		input    string
		expected bool
	}{
		{"ADMIN", false},
		{"/ADMIN", false},
		{"/Admin", false},
		{"/aDmIn", false},
		{"DOCS", false},
		{"/DOCS", false},
		{"AUTH", false},
		{"/AUTH", false},
		{"OAUTH", false},
		{"/OAUTH", false},
		{"HEALTH", false},
		{"/HEALTH", false},
		{"/API", true},
		{"/USERS", true},
		{"/PRoDuCtS", true},
		{"AdMiNiStRaToR", true},
		{"/AuThEnTiCaTiOn", true},
		{"/HeAlThCaRe", true},
		{"/oAuTh2", true},
		{"/API/ADMIN", true},
		{"/CUSTOM/PATH", true},
	}

	for _, tt := range caseSensitiveCases {
		t.Run(fmt.Sprintf("Case sensitivity: %s", tt.input), func(t *testing.T) {
			result := IsBaseURLValid(tt.input)
			if result != tt.expected {
				t.Errorf("IsBaseURLValid(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestConvertToEmoji(t *testing.T) {
	tests := []struct {
		codePoint string
		expected  string
	}{
		{"U+1F600", "😀"},                 // Grinning face
		{"u+1F602", "😂"},                 // Face with tears of joy
		{"u+1F60D", "😍"},                 // Heart eyes
		{"U+1F609", "😉"},                 // Winking face
		{"U+2764", "❤"},                  // Red heart
		{"U+003A", ":"},                  // Colon (not an emoji)
		{"U+ZZZZ", "Invalid code point"}, // Invalid code point
		{"U+", "Invalid code point"},     // Empty code point after "U+"
	}

	for _, test := range tests {
		result := ConvertToEmoji(test.codePoint)
		if result != test.expected {
			t.Errorf("ConvertToEmoji(%q) = %q; expected %q", test.codePoint, result, test.expected)
		}
	}
}

func TestArrayContains(t *testing.T) {
	tests := []struct {
		name     string
		arr      []string
		value    string
		expected bool
	}{
		{
			name:     "Value exists in array",
			arr:      []string{"apple", "banana", "cherry"},
			value:    "banana",
			expected: true,
		},
		{
			name:     "Value does not exist in array",
			arr:      []string{"apple", "banana", "cherry"},
			value:    "grape",
			expected: false,
		},
		{
			name:     "Empty array",
			arr:      []string{},
			value:    "apple",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ArrayContains(tt.arr, tt.value)
			if result != tt.expected {
				t.Errorf("ArrayContains(%v, %q) = %v; expected %v", tt.arr, tt.value, result, tt.expected)
			}
		})
	}
}

func TestToBase64(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{
			input:    "Hello, World!",
			expected: "SGVsbG8sIFdvcmxkIQ==",
		},
		{
			input:    "1234567890",
			expected: "MTIzNDU2Nzg5MA==",
		},
		{
			input:    "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			output := ToBase64(tt.input)
			if output != tt.expected {
				t.Errorf("ToBase64(%q) = %q, expected %q", tt.input, output, tt.expected)
			}
		})
	}
}
