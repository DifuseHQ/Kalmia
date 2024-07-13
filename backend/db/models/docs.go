package models

import "time"

type Page struct {
	ID              uint       `gorm:"primarykey" json:"id"`
	AuthorID        uint       `json:"authorId,omitempty"`
	Title           string     `json:"title,omitempty"`
	Slug            string     `gorm:"unique" json:"slug,omitempty"`
	Content         string     `json:"content,omitempty"`
	CreatedAt       *time.Time `json:"createdAt,omitempty"`
	UpdatedAt       *time.Time `json:"updatedAt,omitempty"`
	DocumentationID uint       `json:"documentationId,omitempty"`
	PageGroupID     *uint      `json:"pageGroupId,omitempty" gorm:"foreignKey:PageGroupID"`
	Order           *uint      `json:"order,omitempty"`
}

type PageGroup struct {
	ID              uint       `gorm:"primarykey" json:"id"`
	DocumentationID uint       `json:"documentationId,omitempty"`
	ParentID        *uint      `json:"parentId,omitempty"`
	Name            string     `json:"name,omitempty"`
	CreatedAt       *time.Time `json:"createdAt,omitempty"`
	UpdatedAt       *time.Time `json:"updatedAt,omitempty"`
	Pages           []Page     `json:"pages,omitempty" gorm:"foreignKey:PageGroupID"`
	Order           *uint      `json:"order,omitempty"`
}

type Documentation struct {
	ID          uint        `gorm:"primarykey" json:"id"`
	Name        string      `gorm:"unique" json:"name,omitempty"`
	Description string      `json:"description,omitempty"`
	CreatedAt   *time.Time  `json:"createdAt,omitempty"`
	UpdatedAt   *time.Time  `json:"updatedAt,omitempty"`
	PageGroups  []PageGroup `gorm:"foreignKey:DocumentationID" json:"pageGroups,omitempty"`
	Pages       []Page      `gorm:"foreignKey:DocumentationID" json:"pages,omitempty"`
}
