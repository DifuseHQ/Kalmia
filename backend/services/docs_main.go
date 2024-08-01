package services

import (
	"gorm.io/gorm"
)

type DocService struct {
	DB *gorm.DB
}

func NewDocService(db *gorm.DB) *DocService {
	return &DocService{DB: db}
}
