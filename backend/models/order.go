package models

import "time"

type Order struct {
	ID           uint        `gorm:"primaryKey" json:"id"`
	OrderToken   string      `gorm:"uniqueIndex" json:"order_token"` // Public ID
	CollectionID *uint       `gorm:"index" json:"collection_id"`
	Total        float64     `gorm:"not null" json:"total"`
	CustomerName string      `json:"customer_name"`
	CustomerPhone string     `json:"customer_phone"`
	Items        []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
	CreatedAt    time.Time   `gorm:"autoCreateTime" json:"created_at"`
}

type OrderItem struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	OrderID   uint    `gorm:"not null;index" json:"order_id"`
	ProductID *uint    `gorm:"index;constraint:OnDelete:SET NULL" json:"product_id"`
	Product   *Product `json:"product"`
	Quantity  int     `gorm:"not null" json:"quantity"`
	Size      string  `json:"size"`
	Price     float64 `gorm:"not null" json:"price"` // Snapshot price
}

type CreateOrderInput struct {
	Items []struct {
		ProductID uint   `json:"product_id" binding:"required"`
		Quantity  int    `json:"quantity" binding:"required"`
		Size      string `json:"size"`
	} `json:"items" binding:"required"`
}
