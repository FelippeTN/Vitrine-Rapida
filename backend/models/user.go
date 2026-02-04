package models

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"unique;not null" json:"username"`
	Email     string    `gorm:"unique;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Number    string    `gorm:"unique;not null" json:"number"`
	PlanID    uint      `gorm:"not null;default:1" json:"plan_id"`
	Plan      *Plan     `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
	ResetToken          string    `json:"-"`
	ResetTokenExpiresAt time.Time `json:"-"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
