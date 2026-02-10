package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/FelippeTN/Web-Catalogo/backend/config"
	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/FelippeTN/Web-Catalogo/backend/utils"
	"golang.org/x/crypto/bcrypt"

	"github.com/gin-gonic/gin"
)

func GetMe(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user models.User

	if err := database.DB.Preload("Plan").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func UpdateMe(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user models.User

	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	var input struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Number   string `json:"number"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	if input.Username != "" {
		username := sanitizeInput(input.Username, config.MaxUsernameLength)
		if !validateUsername(username) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nome da loja inválido. Use apenas letras, números e espaços."})
			return
		}
		user.Username = username
	}

	if input.Number != "" {
		number := regexp.MustCompile(`[^0-9]`).ReplaceAllString(input.Number, "")
		if len(number) < 10 || len(number) > 11 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Número de telefone inválido"})
			return
		}
		user.Number = number
	}

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao atualizar dados. Verifique se o email ou nome já estão em uso."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dados atualizados com sucesso", "user": user})
}

func ChangePassword(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user models.User

	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	var input struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. A nova senha deve ter no mínimo 6 caracteres."})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Senha atual incorreta"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar nova senha"})
		return
	}

	user.Password = string(hashedPassword)
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar nova senha"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Senha alterada com sucesso"})
}

func ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email inválido"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))

	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Se o email estiver cadastrado, você receberá instruções para redefinir a senha."})
		return
	}

	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro interno"})
		return
	}
	token := hex.EncodeToString(bytes)

	user.ResetToken = token
	user.ResetTokenExpiresAt = time.Now().Add(1 * time.Hour)

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar solicitação"})
		return
	}

	resetLink := fmt.Sprintf("https://vitrinerapida.com.br/reset-password?token=%s", token)
	subject := "Redefinição de Senha - Vitrine Rápida"
	body := fmt.Sprintf(`
		<h1>Redefinição de Senha</h1>
		<p>Você solicitou a redefinição de sua senha.</p>
		<p>Clique no link abaixo para prosseguir:</p>
		<a href="%s">%s</a>
		<p>Este link expira em 1 hora.</p>
		<p>Se você não solicitou isso, ignore este email.</p>
	`, resetLink, resetLink)

	log.Printf("Password reset requested for %s", email)

	go func() {
		if err := utils.SendEmail([]string{email}, subject, body); err != nil {
			log.Printf("Failed to send reset email to %s: %v", email, err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Se o email estiver cadastrado, você receberá instruções para redefinir a senha."})
}

func ResetPassword(c *gin.Context) {
	var input struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	var user models.User
	if err := database.DB.Where("reset_token = ? AND reset_token_expires_at > ?", input.Token, time.Now()).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token inválido ou expirado"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar senha"})
		return
	}

	user.Password = string(hashedPassword)
	user.ResetToken = ""
	user.ResetTokenExpiresAt = time.Now()

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar senha"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Senha redefinida com sucesso"})
}
