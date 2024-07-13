package db

import (
	"errors"
	"git.difuse.io/Difuse/kalmia/config"
	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"github.com/glebarez/sqlite"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
	"log"
	"path"
)

func SetupDatabase(env string, dbURL string, dataPath string) *gorm.DB {
	var db *gorm.DB
	var err error

	ormConfig := &gorm.Config{
		Logger: gormLogger.Default.LogMode(gormLogger.Silent),
	}

	if env == "production" || env == "prod" {
		db, err = gorm.Open(postgres.Open(dbURL), ormConfig)
	} else {
		db, err = gorm.Open(sqlite.Open(path.Join(dataPath, "kalmia.db")), ormConfig)
	}

	if err != nil {
		logger.Error("failed to connect to database", zap.Error(err))
	}

	db.Exec("PRAGMA foreign_keys = ON")
	db.Exec("PRAGMA journal_mode = WAL")

	err = db.AutoMigrate(
		&models.Token{},
		&models.User{},
		&models.Page{},
		&models.PageGroup{},
		&models.Documentation{},
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

	docSite = models.Documentation{
		Name:        "Dummy Documentation Site",
		Description: "A sample documentation site for demonstration purposes.",
		ID:          1,
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
	}

	db.Create(&strayPage)

	pageGroups := []struct {
		Name     string
		Pages    []models.Page
		Children []struct {
			Name     string
			Pages    []models.Page
			Children []struct {
				Name  string
				Pages []models.Page
			}
		}
	}{
		{
			Name: "First Page Group",
			Pages: []models.Page{
				{Title: "Dummy Page 1", Content: "Lorem ipsum dolor sit amet.", Slug: "dummy-page-1", DocumentationID: docSite.ID, Order: uintPtr(0)},
				{Title: "Dummy Page 2", Content: "Consectetur adipiscing elit.", Slug: "dummy-page-2", DocumentationID: docSite.ID, Order: uintPtr(1)},
			},
		},
		{
			Name: "Second Page Group",
			Pages: []models.Page{
				{Title: "Dummy Page 3", Content: "Sed do eiusmod tempor incididunt.", Slug: "dummy-page-3", DocumentationID: docSite.ID, Order: uintPtr(2)},
			},
			Children: []struct {
				Name     string
				Pages    []models.Page
				Children []struct {
					Name  string
					Pages []models.Page
				}
			}{
				{
					Name: "Third Page Group",
					Pages: []models.Page{
						{Title: "Dummy Page 4", Content: "Ut labore et dolore magna aliqua.", Slug: "dummy-page-4", DocumentationID: docSite.ID, Order: uintPtr(3)},
						{Title: "Dummy Page 5", Content: "Ut enim ad minim veniam.", Slug: "dummy-page-5", DocumentationID: docSite.ID, Order: uintPtr(4)},
					},
					Children: []struct {
						Name  string
						Pages []models.Page
					}{
						{
							Name: "Fourth Page Group",
							Pages: []models.Page{
								{Title: "Dummy Page 6", Content: "Exercitation ullamco laboris nisi.", Slug: "dummy-page-6", DocumentationID: docSite.ID, Order: uintPtr(5)},
							},
						},
					},
				},
			},
		},
	}

	for _, group := range pageGroups {
		var newGroup models.PageGroup
		result := db.FirstOrCreate(&newGroup, models.PageGroup{Name: group.Name, DocumentationID: docSite.ID})
		if result.Error != nil {
			logger.Error("Failed to create page group", zap.String("name", group.Name), zap.Error(result.Error))
			continue
		}

		for _, page := range group.Pages {
			page.PageGroupID = &newGroup.ID
			db.Create(&page)
		}

		for _, child := range group.Children {
			var childGroup models.PageGroup
			result := db.FirstOrCreate(&childGroup, models.PageGroup{Name: child.Name, ParentID: &newGroup.ID, DocumentationID: docSite.ID})
			if result.Error != nil {
				logger.Error("Failed to create child page group", zap.String("name", child.Name), zap.Error(result.Error))
				continue
			}

			for _, page := range child.Pages {
				page.PageGroupID = &childGroup.ID
				db.Create(&page)
			}

			for _, subChild := range child.Children {
				var subChildGroup models.PageGroup
				result := db.FirstOrCreate(&subChildGroup, models.PageGroup{Name: subChild.Name, ParentID: &childGroup.ID, DocumentationID: docSite.ID})
				if result.Error != nil {
					logger.Error("Failed to create sub-child page group", zap.String("name", subChild.Name), zap.Error(result.Error))
					continue
				}

				for _, page := range subChild.Pages {
					page.PageGroupID = &subChildGroup.ID
					db.Create(&page)
				}
			}
		}
	}

	logger.Info("Database initialized")
}
