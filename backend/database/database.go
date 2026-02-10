package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=America/Sao_Paulo",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	const maxAttempts = 10
	const baseDelay = time.Second

	var (
		database *gorm.DB
		err      error
	)

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		database, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			sqlDB, dbErr := database.DB()
			if dbErr == nil {
				if err = sqlDB.Ping(); err == nil {
					break
				}
			} else {
				err = dbErr
			}
		}

		log.Printf("Database not ready (attempt %d/%d): %v", attempt, maxAttempts, err)
		time.Sleep(time.Duration(attempt) * baseDelay)
	}

	if err != nil {
		log.Fatal("Failed to connect to database!", err)
	}

	err = database.AutoMigrate(&models.Plan{})
	if err != nil {
		log.Fatal("Failed to migrate Plan table!", err)
	}

	seedPlans(database)

	err = database.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatal("Failed to migrate User table!", err)
	}

	err = database.AutoMigrate(
		&models.Collection{},
		&models.Product{},
		&models.ProductImage{},
		&models.Order{},
		&models.OrderItem{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database!", err)
	}
// Deletar isso aqui dps
	if database.Migrator().HasColumn(&models.Product{}, "stock") {
		if err := database.Migrator().DropColumn(&models.Product{}, "stock"); err != nil {
			log.Printf("Warning: could not drop 'stock' column: %v", err)
		} else {
			log.Println("Dropped 'stock' column from products table")
		}
	}

	DB = database
}

func seedPlans(db *gorm.DB) {
	validNames := make([]string, len(models.DefaultPlans))
	for i, plan := range models.DefaultPlans {
		validNames[i] = plan.Name
	}

	if err := db.Where("name NOT IN ?", validNames).Delete(&models.Plan{}).Error; err != nil {
		log.Printf("Failed to delete old plans: %v", err)
	} else {
		log.Println("Cleaned up old plans")
	}

	for _, plan := range models.DefaultPlans {
		var existing models.Plan
		result := db.Where("name = ?", plan.Name).First(&existing)
		if result.Error != nil {
			if err := db.Create(&plan).Error; err != nil {
				log.Printf("Failed to seed plan %s: %v", plan.Name, err)
			} else {
				log.Printf("Seeded plan: %s", plan.Name)
			}
		} else {
			existing.DisplayName = plan.DisplayName
			existing.Description = plan.Description
			existing.Price = plan.Price
			existing.MaxProducts = plan.MaxProducts
			existing.MaxCollections = plan.MaxCollections
			existing.Features = plan.Features
			existing.IsActive = plan.IsActive
			if err := db.Save(&existing).Error; err != nil {
				log.Printf("Failed to update plan %s: %v", plan.Name, err)
			} else {
				log.Printf("Updated plan: %s", plan.Name)
			}
		}
	}
}
