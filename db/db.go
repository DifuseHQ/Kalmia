package db

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"path"
	"strings"

	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"github.com/glebarez/sqlite"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

func SetupDatabase(env string, database string, dataPath string) *gorm.DB {
	var db *gorm.DB
	var err error

	ormConfig := &gorm.Config{
		Logger:                 gormLogger.Default.LogMode(gormLogger.Silent),
		SkipDefaultTransaction: true,
	}

	if database == "sqlite" {
		db, err = gorm.Open(sqlite.Open(path.Join(dataPath, "kalmia.db")), ormConfig)
	} else {
		db, err = gorm.Open(postgres.Open(database), ormConfig)
	}

	if err != nil {
		logger.Panic("failed to connect to database", zap.Error(err))
	}

	if database == "sqlite" {
		db.Exec("PRAGMA foreign_keys = ON")
		db.Exec("PRAGMA journal_mode = WAL")
		db.Exec("PRAGMA synchronous = NORMAL")
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Token{},
		&models.Documentation{},
		&models.BuildTriggers{},
		&models.PageGroup{},
		&models.Page{},
	)

	if err != nil {
		logger.Panic("failed to migrate database", zap.Error(err))
	}

	db.Exec("UPDATE pages SET is_page = TRUE WHERE is_page IS NULL")
	db.Exec("UPDATE pages SET is_page_group = TRUE WHERE is_page_group IS NULL")

	err = updateUserPermissions(db)

	if err != nil {
		logger.Error("User permissions update failed", zap.Error(err))
	}

	return db
}

func SetupBasicData(db *gorm.DB, admins []config.User) {
	for _, admin := range admins {
		var user models.User
		err := db.Where("username = ?", admin.Username).Or("email = ?", admin.Email).First(&user).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			hashedPassword, hashErr := utils.HashPassword(admin.Password)
			if hashErr != nil {
				logger.Error("Failed to hash password for admin", zap.String("username", admin.Username), zap.Error(hashErr))
				continue
			}

			newUser := models.User{
				Username:    admin.Username,
				Password:    hashedPassword,
				Email:       admin.Email,
				Admin:       admin.Admin,
				Permissions: "",
			}

			var permissions []string

			if admin.Admin {
				permissions = append(permissions, "all")
			} else {
				permissions = append(permissions, "read", "write", "delete")
			}

			jsonPermissions, err := json.Marshal(permissions)

			if err != nil {
				logger.Error("Failed to marshal permissions", zap.String("username", admin.Username), zap.Error(err))
				continue
			}

			newUser.Permissions = string(jsonPermissions)

			result := db.Create(&newUser)
			if result.Error != nil {
				logger.Error("Failed to create admin user", zap.String("username", admin.Username), zap.Error(result.Error))
				continue
			}
		} else if err != nil {
			log.Printf("Error checking for admin user %v: %v", admin.Username, err)
		}
	}

	logger.Info("Database initialized")
}

func updateUserPermissions(db *gorm.DB) error {
	var result *gorm.DB
	dialectName := strings.ToLower(db.Dialector.Name())

	if dialectName == "postgres" {
		result = db.Exec(`
            UPDATE users
            SET permissions = CASE
                WHEN (permissions IS NULL OR permissions = '') AND (admin::boolean = true) THEN '["all"]'
                WHEN (permissions IS NULL OR permissions = '') AND (admin::boolean = false OR admin IS NULL) THEN '["read"]'
                ELSE permissions
            END
            WHERE permissions IS NULL OR permissions = ''
        `)
	} else if dialectName == "sqlite" {
		result = db.Exec(`
            UPDATE users
            SET permissions = CASE
                WHEN (permissions IS NULL OR permissions = '') AND (admin = 1) THEN '["all"]'
                WHEN (permissions IS NULL OR permissions = '') AND (admin = 0 OR admin IS NULL) THEN '["read"]'
                ELSE permissions
            END
            WHERE permissions IS NULL OR permissions = ''
        `)
	} else {
		return fmt.Errorf("unsupported database dialect: %s", dialectName)
	}

	if result.Error != nil {
		return result.Error
	}

	return nil
}
