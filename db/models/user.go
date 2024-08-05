package models

import (
	jsonx "github.com/clarketm/json"
	"time"
)

type Token struct {
	ID        uint      `gorm:"primarykey" json:"id,omitempty"`
	UserID    uint      `json:"userId,omitempty"`
	Token     string    `gorm:"index:,unique" json:"token,omitempty"`
	Expiry    int64     `json:"expiry,omitempty"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt,omitempty"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt,omitempty"`
}

func (s Token) MarshalJSON() ([]byte, error) {
	type TmpStruct Token
	return jsonx.Marshal(TmpStruct(s))
}

type User struct {
	ID        uint       `gorm:"primarykey" json:"id,omitempty"`
	Admin     bool       `json:"admin,omitempty"`
	Photo     string     `json:"photo,omitempty"`
	Username  string     `gorm:"unique" json:"username,omitempty"`
	Email     string     `gorm:"unique" json:"email,omitempty"`
	Password  string     `json:"password,omitempty"`
	Tokens    []Token    `json:"tokens,omitempty"`
	CreatedAt *time.Time `gorm:"autoCreateTime" json:"createdAt,omitempty"`
	UpdatedAt *time.Time `gorm:"autoUpdateTime" json:"updatedAt,omitempty"`
}

func (s User) MarshalJSON() ([]byte, error) {
	type TmpStruct User
	return jsonx.Marshal(TmpStruct(s))
}
