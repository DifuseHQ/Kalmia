package models

import (
	"time"
)

type Token struct {
	ID        uint `gorm:"primarykey"`
	UserID    uint
	Token     string `gorm:"index:,unique"`
	Expiry    int64
	CreatedAt time.Time
	UpdatedAt time.Time
}

type User struct {
	ID        uint `gorm:"primarykey"`
	Admin     bool
	Photo     string
	Username  string `gorm:"unique"`
	Email     string `gorm:"unique"`
	Password  string
	Tokens    []Token
	CreatedAt time.Time
	UpdatedAt time.Time
}
