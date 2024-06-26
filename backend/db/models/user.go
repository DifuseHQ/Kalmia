package models

import (
	"time"
)

type User struct {
	ID        uint `gorm:"primarykey"`
	Admin     bool
	Photo     string
	Username  string `gorm:"unique"`
	Email     string `gorm:"unique"`
	Password  string
	JWT       string
	JWTExpiry int64
	CreatedAt time.Time
	UpdatedAt time.Time
}
