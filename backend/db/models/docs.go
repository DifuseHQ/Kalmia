package models

import (
	"time"

	jsonx "github.com/clarketm/json"
)

type Page struct {
	ID              uint       `gorm:"primarykey" json:"id,omitempty"`
	AuthorID        uint       `json:"authorId,omitempty"`
	Author          User       `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	DocumentationID uint       `gorm:"index:idx_doc_slug,unique:true,composite:true" json:"documentationId,omitempty"`
	PageGroupID     *uint      `json:"pageGroupId,omitempty" gorm:"foreignKey:PageGroupID"`
	Title           string     `json:"title,omitempty"`
	Slug            string     `gorm:"index:idx_doc_slug,unique:true,composite:true" json:"slug,omitempty"`
	Content         string     `json:"content,omitempty"`
	CreatedAt       *time.Time `gorm:"autoCreateTime" json:"createdAt,omitempty"`
	UpdatedAt       *time.Time `gorm:"autoUpdateTime" json:"updatedAt,omitempty"`
	Order           *uint      `json:"order,omitempty"`
	Editors         []User     `gorm:"many2many:page_editors;" json:"editors,omitempty"`
	LastEditorID    *uint      `json:"lastEditorId,omitempty"`
}

func (s Page) MarshalJSON() ([]byte, error) {
	type TmpStruct Page
	return jsonx.Marshal(TmpStruct(s))
}

type PageGroup struct {
	ID              uint       `gorm:"primarykey" json:"id,omitempty"`
	DocumentationID uint       `json:"documentationId,omitempty"`
	ParentID        *uint      `json:"parentId,omitempty"`
	AuthorID        uint       `json:"authorId,omitempty"`
	Author          User       `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Name            string     `json:"name,omitempty"`
	CreatedAt       *time.Time `gorm:"autoCreateTime" json:"createdAt,omitempty"`
	UpdatedAt       *time.Time `gorm:"autoUpdateTime" json:"updatedAt,omitempty"`
	Order           *uint      `json:"order,omitempty"`
	Editors         []User     `gorm:"many2many:pagegroup_editors;" json:"editors,omitempty"`
	LastEditorID    *uint      `json:"lastEditorId,omitempty"`
	Pages           []Page     `json:"pages,omitempty" gorm:"foreignKey:PageGroupID;constraint:OnDelete:CASCADE"`
}

func (s PageGroup) MarshalJSON() ([]byte, error) {
	type TmpStruct PageGroup
	return jsonx.Marshal(TmpStruct(s))
}

type Documentation struct {
	ID               uint        `gorm:"primarykey" json:"id,omitempty"`
	Name             string      `gorm:"index:idx_name_root" json:"name,omitempty"`
	Version          string      `json:"version,omitempty"`
	ClonedFrom       *uint       `gorm:"default:null" json:"clonedFrom"`
	Description      string      `json:"description,omitempty"`
	Favicon          string      `json:"favicon,omitempty"`
	MetaImage        string      `json:"metaImage,omitempty"`
	NavImage         string      `json:"navImage,omitempty"`
	CustomCSS        string      `json:"customCSS,omitempty"`
	FooterLabelLinks string      `json:"footerLabelLinks,omitempty"`
	MoreLabelLinks   string      `json:"moreLabelLinks,omitempty"`
	CopyrightText    string      `json:"copyrightText,omitempty"`
	AuthorID         uint        `json:"authorId,omitempty"`
	Author           User        `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	CreatedAt        *time.Time  `gorm:"autoCreateTime" json:"createdAt,omitempty"`
	UpdatedAt        *time.Time  `gorm:"autoUpdateTime" json:"updatedAt,omitempty"`
	Editors          []User      `gorm:"many2many:documentation_editors;" json:"editors,omitempty"`
	LastEditorID     *uint       `json:"lastEditorId,omitempty"`
	PageGroups       []PageGroup `gorm:"foreignKey:DocumentationID;constraint:OnDelete:CASCADE" json:"pageGroups,omitempty"`
	Pages            []Page      `gorm:"foreignKey:DocumentationID;constraint:OnDelete:CASCADE" json:"pages,omitempty"`
}

func (s Documentation) MarshalJSON() ([]byte, error) {
	type TmpStruct Documentation
	return jsonx.Marshal(TmpStruct(s))
}
