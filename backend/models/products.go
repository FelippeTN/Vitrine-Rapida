package models

import "time"

type Product struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	OwnerID      uint      `gorm:"not null;index" json:"owner_id"`
	CollectionID *uint     `gorm:"index" json:"collection_id"`
	Name         string    `gorm:"not null" json:"name"`
	Description  string    `gorm:"not null" json:"description"`
	Price        float64   `gorm:"not null" json:"price"`
	ImageURL     *string   `json:"image_url"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type CreateProductInput struct {
	Name         string  `json:"name" form:"name" binding:"required"`
	Description  string  `json:"description" form:"description" binding:"required"`
	Price        float64 `json:"price" form:"price" binding:"required"`
	CollectionID *uint   `json:"collection_id" form:"collection_id"`
	ImageURL     *string `json:"image_url" form:"image_url"`
}

type UpdateProductInput struct {
	Name         *string  `json:"name" form:"name"`
	Description  *string  `json:"description" form:"description"`
	Price        *float64 `json:"price" form:"price"`
	CollectionID *uint    `json:"collection_id" form:"collection_id"`
	ImageURL     *string  `json:"image_url" form:"image_url"`
}
