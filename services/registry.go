package services

import "gorm.io/gorm"

type ServiceRegistry struct {
	AuthService *AuthService
	DocService  *DocService
}

func NewServiceRegistry(db *gorm.DB) *ServiceRegistry {
	return &ServiceRegistry{
		AuthService: NewAuthService(db),
		DocService:  NewDocService(db),
	}
}
