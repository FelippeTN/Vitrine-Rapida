package database

import (
	"fmt"
	"log"
	"os"

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

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

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
	)
	if err != nil {
		log.Fatal("Failed to migrate database!", err)
	}

	DB = database
}

func seedPlans(db *gorm.DB) {
	for _, plan := range models.DefaultPlans {
		var existing models.Plan
		result := db.Where("name = ?", plan.Name).First(&existing)
		if result.Error != nil {
			if err := db.Create(&plan).Error; err != nil {
				log.Printf("Failed to seed plan %s: %v", plan.Name, err)
			} else {
				log.Printf("Seeded plan: %s", plan.Name)
			}
		}
	}
}
