package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/FelippeTN/Web-Catalogo/backend/config"
	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/FelippeTN/Web-Catalogo/backend/utils"
	"github.com/gin-gonic/gin"
)

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

	if !utils.IsImageFile(file) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo de arquivo inválido. Use JPEG ou PNG"})
		return
	}

	if file.Size > config.MaxLogoSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo muito grande. Máximo 2MB"})
		return
	}

	logosDir := "./uploads/logos"
	if err := utils.CreateDirIfNotExists(logosDir); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar diretório: " + err.Error()})
		return
	}

	filename := fmt.Sprintf("logo_%v_%d.jpg", userID, time.Now().Unix())
	destPath := fmt.Sprintf("%s/%s", logosDir, filename)

	if err := utils.SaveCompressedImage(file, destPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar imagem: " + err.Error()})
		return
	}

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

	user.LogoURL = ""
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover logo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logo removida com sucesso"})
}
