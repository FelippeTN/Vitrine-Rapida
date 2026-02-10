package handlers

import (
	"html"
	"net/http"
	"os"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/FelippeTN/Web-Catalogo/backend/utils"
	"golang.org/x/crypto/bcrypt"

	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

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
	if len(username) < 2 || len(username) > 50 {
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
	if len(input.Password) > 128 {
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

	username := sanitizeInput(input.Username, 50)
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

	if len(input.Password) > 128 {
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
		user.Username = input.Username
	}
	if input.Number != "" {
		user.Number = input.Number
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

	// Verify current password
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
		// Do not reveal if email exists or not
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
	user.ResetTokenExpiresAt = time.Now().Add(1 * time.Hour) // 1 hour expiry

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

	fmt.Printf("RESET TOKEN FOR %s: %s\nLINK: %s\n", email, token, resetLink)

	go func() {
		if err := utils.SendEmail([]string{email}, subject, body); err != nil {
			fmt.Printf("Failed to send reset email to %s: %v\n", email, err)
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
	user.ResetToken = "" // Clear token
	user.ResetTokenExpiresAt = time.Now()

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar senha"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Senha redefinida com sucesso"})
}

func UploadLogo(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	file, err := c.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo de logo não fornecido"})
		return
	}

	// Validate file type
	if !utils.IsImageFile(file) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo de arquivo inválido. Use JPEG ou PNG"})
		return
	}

	// Validate file size (max 2MB)
	if file.Size > 2*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo muito grande. Máximo 2MB"})
		return
	}

	// Create logos directory if not exists
	logosDir := "./uploads/logos"
	if err := createDirIfNotExists(logosDir); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar diretório: " + err.Error()})
		return
	}

	// Generate filename
	filename := fmt.Sprintf("logo_%d_%d.jpg", userID, time.Now().Unix())
	destPath := fmt.Sprintf("%s/%s", logosDir, filename)

	// Save and compress image
	if err := utils.SaveCompressedImage(file, destPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar imagem: " + err.Error()})
		return
	}

	// Update user logo URL
	logoURL := fmt.Sprintf("/uploads/logos/%s", filename)
	user.LogoURL = logoURL
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar logo: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logo atualizada com sucesso", "logo_url": logoURL})
}

func DeleteLogo(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Clear logo URL
	user.LogoURL = ""
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover logo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logo removida com sucesso"})
}

func createDirIfNotExists(dir string) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return os.MkdirAll(dir, 0755)
	}
	return nil
}
