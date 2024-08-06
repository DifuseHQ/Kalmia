package db

import (
	"errors"
	"log"
	"path"

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
		logger.Error("failed to connect to database", zap.Error(err))
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
		logger.Error("failed to migrate database", zap.Error(err))
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
				Username: admin.Username,
				Password: hashedPassword,
				Email:    admin.Email,
				Admin:    admin.Admin,
			}
			result := db.Create(&newUser)
			if result.Error != nil {
				logger.Error("Failed to create admin user", zap.String("username", admin.Username), zap.Error(result.Error))
				continue
			}
		} else if err != nil {
			log.Printf("Error checking for admin user %v: %v", admin.Username, err)
		}
	}

	if !config.ParsedConfig.AddDummyData {
		logger.Info("Skipping dummy data creation, database initialized")
		return
	}

	var docSite models.Documentation

	if err := db.Where("name = ?", "Dummy Documentation Site").First(&docSite).Error; err == nil {
		logger.Info("Dummy data already exists, skipping creation")
		return
	}

	var firstUser models.User

	if err := db.First(&firstUser).Error; err != nil {
		logger.Error("Failed to fetch first user", zap.Error(err))
		return
	}

	docSite = models.Documentation{
		ID:          0,
		Name:        "Dummy Documentation Site",
		Description: "A sample documentation site for demonstration purposes.",
		Version:     "1.0",
		AuthorID:    firstUser.ID,
		Author:      firstUser,
		Editors:     []models.User{firstUser},
	}

	if err := db.FirstOrCreate(&docSite, models.Documentation{Name: docSite.Name}).Error; err != nil {
		logger.Error("Failed to create documentation site", zap.Error(err))
		return
	}

	uintPtr := func(i uint) *uint { return &i }

	strayPage := models.Page{
		Title:           "Stray Page",
		Content:         "This is a stray page without a parent group.",
		Slug:            "stray-page",
		DocumentationID: docSite.ID,
		Order:           uintPtr(0),
		AuthorID:        firstUser.ID,
		Author:          firstUser,
		Editors:         []models.User{firstUser},
	}

	db.Create(&strayPage)

	pg1 := createPageGroupWithPages(db, "First Page Group", &docSite, firstUser, nil, []string{"Dummy Page 1", "Dummy Page 2"})
	pg2 := createPageGroupWithPages(db, "Second Page Group", &docSite, firstUser, nil, []string{"Dummy Page 3"})
	if pg1 != nil && pg2 != nil {
		pg3 := createPageGroupWithPages(db, "Third Page Group", &docSite, firstUser, &pg2.ID, []string{"Dummy Page 4", "Dummy Page 5"})
		if pg3 != nil {
			createPageGroupWithPages(db, "Fourth Page Group", &docSite, firstUser, &pg3.ID, []string{"Dummy Page 6"})
		}
	}

	logger.Info("Database initialized")
}

func createPageGroupWithPages(db *gorm.DB, groupName string, doc *models.Documentation, user models.User, parentID *uint, pageTitles []string) *models.PageGroup {
	pageGroup := models.PageGroup{
		Name:            groupName,
		DocumentationID: doc.ID,
		ParentID:        parentID,
		AuthorID:        user.ID,
		Editors:         []models.User{user},
	}

	if err := db.Create(&pageGroup).Error; err != nil {
		logger.Error("Failed to create page group", zap.String("name", groupName), zap.Error(err))
		return nil
	}

	if err := db.Model(&pageGroup).Association("Editors").Append(&user); err != nil {
		logger.Error("Failed to add editor to page group", zap.String("name", groupName), zap.Error(err))
	}

	for _, title := range pageTitles {
		page := models.Page{
			Title:           title,
			Content:         "Content for " + title,
			Slug:            title,
			DocumentationID: doc.ID,
			PageGroupID:     &pageGroup.ID,
			AuthorID:        user.ID,
			Editors:         []models.User{user},
		}
		if err := db.Create(&page).Error; err != nil {
			logger.Error("Failed to create page", zap.String("title", title), zap.Error(err))
		}
	}

	return &pageGroup
}
