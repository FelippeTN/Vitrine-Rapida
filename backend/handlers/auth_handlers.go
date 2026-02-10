package handlers

import (
	"html"
	"net/http"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/FelippeTN/Web-Catalogo/backend/config"
	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/FelippeTN/Web-Catalogo/backend/utils"
	"golang.org/x/crypto/bcrypt"

	"github.com/gin-gonic/gin"
)

var (
	emailRegex    = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9À-ÿ\s]+$`)
)

func sanitizeInput(input string, maxLength int) string {
	input = strings.TrimSpace(input)
	input = html.EscapeString(input)

	if utf8.RuneCountInString(input) > maxLength {
		runes := []rune(input)
		input = string(runes[:maxLength])
	}

	return input
}

func validateEmail(email string) bool {
	if len(email) > 254 {
		return false
	}
	return emailRegex.MatchString(email)
}

func validateUsername(username string) bool {
	if len(username) < 2 || len(username) > config.MaxUsernameLength {
		return false
	}
	return usernameRegex.MatchString(username)
}

func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))

	if !validateEmail(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de email inválido"})
		return
	}
	if len(input.Password) > config.MaxPasswordLength {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Senha muito longa"})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func Register(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Number   string `json:"number" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Verifique se todos os campos estão preenchidos e se a senha tem no mínimo 6 caracteres."})
		return
	}

	username := sanitizeInput(input.Username, config.MaxUsernameLength)
	email := strings.ToLower(strings.TrimSpace(input.Email))
	number := regexp.MustCompile(`[^0-9]`).ReplaceAllString(input.Number, "")

	if !validateUsername(username) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nome da loja inválido. Use apenas letras, números e espaços."})
		return
	}

	if !validateEmail(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de email inválido"})
		return
	}

	if len(number) < 10 || len(number) > 11 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Número de telefone inválido"})
		return
	}

	if len(input.Password) > config.MaxPasswordLength {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Senha muito longa (máximo 128 caracteres)"})
		return
	}

	user := models.User{
		Username: username,
		Email:    email,
		Number:   number,
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar senha"})
		return
	}
	user.Password = string(hashedPassword)

	var existingUser models.User
	if err := database.DB.Where("username = ?", username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Esse nome ja esta sendo usado"})
		return
	}

	if err := database.DB.Where("email = ?", email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Este email já está sendo usado"})
		return
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Não foi possível criar o usuário."})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Usuário registrado com sucesso"})
}
