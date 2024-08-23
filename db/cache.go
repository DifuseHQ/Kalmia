package db

import (
	"errors"
	"strings"
	"sync"

	"git.difuse.io/Difuse/kalmia/logger"
)

var (
	Cache *MapCache
	mu    sync.RWMutex
)

type MapCache struct {
	data map[string][]byte
}

func InitCache() {
	Cache = &MapCache{
		data: make(map[string][]byte),
	}
	logger.Info("Cache initialized")
}

func SetKey(key, value []byte) error {
	mu.Lock()
	defer mu.Unlock()
	Cache.data[string(key)] = value
	return nil
}

func GetValue(key []byte) (value []byte, err error) {
	mu.RLock()
	defer mu.RUnlock()
	value, ok := Cache.data[string(key)]
	if !ok {
		return nil, ErrKeyNotFound
	}
	return value, nil
}

func ClearCacheByPrefix(prefix string) error {
	mu.Lock()
	defer mu.Unlock()
	for k := range Cache.data {
		if strings.HasPrefix(k, prefix) {
			delete(Cache.data, k)
		}
	}
	return nil
}

func GetCacheByPrefix(prefix string) (map[string]string, error) {
	mu.RLock()
	defer mu.RUnlock()
	result := make(map[string]string)
	for k, v := range Cache.data {
		if strings.HasPrefix(k, prefix) {
			result[k] = string(v)
		}
	}
	return result, nil
}

// ErrKeyNotFound is returned when a key is not found in the cache
var ErrKeyNotFound = errors.New("key not found")
