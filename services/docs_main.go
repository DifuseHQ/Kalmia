package services

import (
	"sync"

	"gorm.io/gorm"
)

type DocService struct {
	DB          *gorm.DB
	UWBMutexMap sync.Map
}

func NewDocService(db *gorm.DB) *DocService {
	return &DocService{DB: db}
}
