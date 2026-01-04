package models

import "time"

type Plan struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"unique;not null" json:"name"`
	DisplayName     string    `gorm:"not null" json:"display_name"`
	Description     string    `gorm:"not null" json:"description"`
	Price           float64   `gorm:"not null;default:0" json:"price"`
	MaxProducts     int       `gorm:"not null;default:10" json:"max_products"`
	MaxCollections  int       `gorm:"not null;default:5" json:"max_collections"`
	Features        string    `gorm:"type:text" json:"features"`
	IsActive        bool      `gorm:"not null;default:true" json:"is_active"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type UserPlanInfo struct {
	Plan            Plan `json:"plan"`
	ProductCount    int  `json:"product_count"`
	CollectionCount int  `json:"collection_count"`
	CanCreateProduct    bool `json:"can_create_product"`
	CanCreateCollection bool `json:"can_create_collection"`
}

var DefaultPlans = []Plan{
	{
		Name:           "free",
		DisplayName:    "Grátis",
		Description:    "Perfeito para começar",
		Price:          0,
		MaxProducts:    10,
		MaxCollections: 2,
		Features:       `["Até 10 produtos", "Até 2 vitrines", "Compartilhamento por link", "Suporte por email"]`,
		IsActive:       true,
	},
	{
		Name:           "starter",
		DisplayName:    "Iniciante",
		Description:    "Para pequenos negócios",
		Price:          29.90,
		MaxProducts:    50,
		MaxCollections: 5,
		Features:       `["Até 50 produtos", "Até 5 vitrines", "Compartilhamento por link", "Suporte prioritário", "Sem marca d'água"]`,
		IsActive:       true,
	},
	{
		Name:           "pro",
		DisplayName:    "Profissional",
		Description:    "Para negócios em crescimento",
		Price:          59.90,
		MaxProducts:    200,
		MaxCollections: 15,
		Features:       `["Até 200 produtos", "Até 15 vitrines", "Compartilhamento por link", "Suporte 24/7", "Domínio personalizado", "Analytics avançado"]`,
		IsActive:       true,
	},
	{
		Name:           "enterprise",
		DisplayName:    "Empresarial",
		Description:    "Para grandes operações",
		Price:          149.90,
		MaxProducts:    -1,
		MaxCollections: -1,
		Features:       `["Produtos ilimitados", "Vitrines ilimitadas", "Compartilhamento por link", "Suporte dedicado", "Domínio personalizado", "Analytics avançado", "API access", "White label"]`,
		IsActive:       true,
	},
}
