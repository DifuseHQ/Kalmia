package db

import (
	"errors"
	"strings"
	"sync"

	"git.difuse.io/Difuse/kalmia/logger"
)

var (
	Cache *sync.Map
)

type CacheEntry struct {
	Data        []byte
	ContentType string
}

func InitCache() {
	Cache = &sync.Map{}
	logger.Info("Cache initialized")
}

func SetKey(key []byte, value []byte, contentType string) error {
	Cache.Store(string(key), CacheEntry{
		Data:        value,
		ContentType: contentType,
	})
	return nil
}

func GetValue(key []byte) (CacheEntry, error) {
	if entry, ok := Cache.Load(string(key)); ok {
		return entry.(CacheEntry), nil
	}
	return CacheEntry{}, ErrKeyNotFound
}

func ClearCacheByPrefix(prefix string) error {
	Cache.Range(func(k, v interface{}) bool {
		if strings.HasPrefix(k.(string), prefix) {
			Cache.Delete(k)
		}
		return true
	})
	return nil
}

func GetCacheByPrefix(prefix string) (map[string]string, error) {
	result := make(map[string]string)
	Cache.Range(func(k, v interface{}) bool {
		if strings.HasPrefix(k.(string), prefix) {
			entry := v.(CacheEntry)
			result[k.(string)] = string(entry.Data)
		}
		return true
	})
	return result, nil
}

var ErrKeyNotFound = errors.New("key not found")
