package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"
)

type oauthEntry struct {
	Token     string
	ExpiresAt time.Time
}

var (
	oauthCodeStore = make(map[string]oauthEntry)
	oauthStoreMu   sync.RWMutex
)

func init() {
	go func() {
		for {
			time.Sleep(30 * time.Second)
			oauthStoreMu.Lock()
			now := time.Now()
			for code, entry := range oauthCodeStore {
				if now.After(entry.ExpiresAt) {
					delete(oauthCodeStore, code)
				}
			}
			oauthStoreMu.Unlock()
		}
	}()
}

func StoreOAuthToken(token string) (string, error) {
	codeBytes := make([]byte, 16)
	if _, err := rand.Read(codeBytes); err != nil {
		return "", fmt.Errorf("failed_to_generate_oauth_code")
	}
	code := hex.EncodeToString(codeBytes)

	oauthStoreMu.Lock()
	oauthCodeStore[code] = oauthEntry{
		Token:     token,
		ExpiresAt: time.Now().Add(5 * time.Minute),
	}
	oauthStoreMu.Unlock()

	return code, nil
}

func ExchangeOAuthCode(code string) (string, error) {
	oauthStoreMu.Lock()
	entry, ok := oauthCodeStore[code]
	if ok {
		delete(oauthCodeStore, code)
	}
	oauthStoreMu.Unlock()

	if !ok {
		return "", fmt.Errorf("invalid_or_expired_code")
	}
	if time.Now().After(entry.ExpiresAt) {
		return "", fmt.Errorf("code_expired")
	}

	return entry.Token, nil
}
