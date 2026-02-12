package models

import "time"

type Plan struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"unique;not null" json:"name"`
	DisplayName     string    `gorm:"not null" json:"display_name"`
	Description     string    `gorm:"not null" json:"description"`
	Price           float64   `gorm:"not null;default:0" json:"price"`
	StripePriceID   string    `json:"stripe_price_id"`
	MaxProducts     int       `gorm:"not null;default:10" json:"max_products"`
	MaxCollections  int       `gorm:"not null;default:5" json:"max_collections"`
	Features        string    `gorm:"type:text" json:"features"`
	IsActive        bool      `gorm:"not null;default:true" json:"is_active"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type UserPlanInfo struct {
	Plan                Plan    `json:"plan"`
	ProductCount        int     `json:"product_count"`
	CollectionCount     int     `json:"collection_count"`
	CanCreateProduct    bool    `json:"can_create_product"`
	CanCreateCollection bool    `json:"can_create_collection"`
	SubscriptionStatus  string  `json:"subscription_status"`
	PlanExpiresAt       *time.Time `json:"plan_expires_at"`
}

var DefaultPlans = []Plan{
	{
		Name:           "free",
		DisplayName:    "Grátis",
		Description:    "Perfeito para começar",
		Price:          0,
		StripePriceID:  "",
		MaxProducts:    10,
		MaxCollections: 2,
		Features:       `["Até 10 produtos", "Até 2 vitrines", "Compartilhamento por link", "Suporte por email"]`,
		IsActive:       true,
	},
	{
		Name:           "basic",
		DisplayName:    "Básico",
		Description:    "Para pequenos negócios",
		Price:          49.90,
		StripePriceID:  "price_1T04Nw7DZFrMXcLSGSzsoQ8a",
		MaxProducts:    30,
		MaxCollections: 3,
		Features:       `["Até 30 produtos", "Até 3 vitrines", "Compartilhamento por link", "Suporte por email"]`,
		IsActive:       true,
	},
	{
		Name:           "plus",
		DisplayName:    "Plus",
		Description:    "Para negócios em crescimento",
		Price:          89.90,
		StripePriceID:  "price_1T04Q87DZFrMXcLSe3vgWoMc",
		MaxProducts:    50,
		MaxCollections: 5,
		Features:       `["Até 50 produtos", "Até 5 vitrines", "Compartilhamento por link", "Suporte prioritário"]`,
		IsActive:       true,
	},
	{
		Name:           "pro",
		DisplayName:    "Profissional",
		Description:    "Para negócios consolidados",
		Price:          129.90,
		StripePriceID:  "price_1T04RH7DZFrMXcLS4LMzv5yT",
		MaxProducts:    100,
		MaxCollections: 10,
		Features:       `["Até 100 produtos", "Até 10 vitrines", "Compartilhamento por link", "Suporte 24/7"]`,
		IsActive:       true,
	},
	{
		Name:           "enterprise",
		DisplayName:    "Empresarial",
		Description:    "Para grandes operações",
		Price:          299.00,
		StripePriceID:  "price_1T04Ra7DZFrMXcLSt3TRUMTH",
		MaxProducts:    -1,
		MaxCollections: -1,
		Features:       `["Produtos ilimitados", "Vitrines ilimitadas", "Compartilhamento por link", "Suporte dedicado"]`,
		IsActive:       true,
	},
}
