package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/FelippeTN/Web-Catalogo/backend/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type shareCollectionResponse struct {
	ShareToken string `json:"share_token"`
}

type publicCatalogResponse struct {
	Collection models.Collection `json:"collection"`
	Products   []models.Product  `json:"products"`
	OwnerPhone string            `json:"owner_phone"`
	StoreName  string            `json:"store_name"`
}

func ShareCollection(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}

	var collection models.Collection
	if err := database.DB.Where("id = ? AND owner_id = ?", uint(id), ownerID).First(&collection).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve collection"})
		return
	}

	if collection.ShareToken == nil || *collection.ShareToken == "" {
		token, err := utils.GenerateShareToken()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate share token"})
			return
		}
		collection.ShareToken = &token
		if err := database.DB.Model(&models.Collection{}).
			Where("id = ? AND owner_id = ?", uint(id), ownerID).
			Update("share_token", token).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save share token"})
			return
		}
	}

	c.JSON(http.StatusOK, shareCollectionResponse{ShareToken: *collection.ShareToken})
}

func GetPublicCatalogByToken(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
		return
	}

	var collection models.Collection
	if err := database.DB.Where("share_token = ?", token).First(&collection).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Catalog not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve catalog"})
		return
	}

	var owner models.User
	ownerPhone := ""
	storeName := ""
	if err := database.DB.First(&owner, collection.OwnerID).Error; err == nil {
		ownerPhone = owner.Number
		storeName = owner.Username
	}

	var products []models.Product
	if err := database.DB.Preload("Images").Where("owner_id = ? AND collection_id = ?", collection.OwnerID, collection.ID).Order("created_at desc").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve products"})
		return
	}

	c.JSON(http.StatusOK, publicCatalogResponse{Collection: collection, Products: products, OwnerPhone: ownerPhone, StoreName: storeName})
}
