package handlers

import (
	"net/http"
	"strconv"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/gin-gonic/gin"
)

type createProductInput struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description" binding:"required"`
	Price        float64 `json:"price" binding:"required"`
	CollectionID *uint   `json:"collection_id"`
}

type updateProductInput struct {
	Name         *string  `json:"name"`
	Description  *string  `json:"description"`
	Price        *float64 `json:"price"`
	CollectionID *uint    `json:"collection_id"`
}

func CreateProduct(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input createProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	if input.CollectionID != nil {
		var collection models.Collection
		if err := database.DB.Where("id = ? AND owner_id = ?", *input.CollectionID, ownerID).First(&collection).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection_id"})
			return
		}
	}

	product := models.Product{
		OwnerID:      ownerID,
		CollectionID: input.CollectionID,
		Name:         input.Name,
		Description:  input.Description,
		Price:        input.Price,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create product"})
		return
	}

	c.JSON(http.StatusCreated, product)
}

func GetProducts(c *gin.Context) {
	var products []models.Product

	query := database.DB.Model(&models.Product{})
	if ownerIDRaw := c.Query("owner_id"); ownerIDRaw != "" {
		ownerIDParsed, err := strconv.ParseUint(ownerIDRaw, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid owner_id"})
			return
		}
		query = query.Where("owner_id = ?", uint(ownerIDParsed))
	}
	if collectionIDRaw := c.Query("collection_id"); collectionIDRaw != "" {
		collectionIDParsed, err := strconv.ParseUint(collectionIDRaw, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection_id"})
			return
		}
		query = query.Where("collection_id = ?", uint(collectionIDParsed))
	}

	if err := query.Order("created_at desc").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve products"})
		return
	}

	c.JSON(http.StatusOK, products)
}

func GetMyProducts(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var products []models.Product
	if err := database.DB.Where("owner_id = ?", ownerID).Order("created_at desc").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve products"})
		return
	}

	c.JSON(http.StatusOK, products)
}

func UpdateProduct(c *gin.Context) {
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

	var input updateProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	updates := map[string]any{}
	if input.Name != nil {
		updates["name"] = *input.Name
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if input.Price != nil {
		updates["price"] = *input.Price
	}
	if input.CollectionID != nil {
		updates["collection_id"] = *input.CollectionID
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	result := database.DB.Model(&models.Product{}).
		Where("id = ? AND owner_id = ?", uint(id), ownerID).
		Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update product"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var updated models.Product
	if err := database.DB.Where("id = ? AND owner_id = ?", uint(id), ownerID).First(&updated).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve updated product"})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func DeleteProduct(c *gin.Context) {
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

	result := database.DB.Where("id = ? AND owner_id = ?", uint(id), ownerID).Delete(&models.Product{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not delete product"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.Status(http.StatusNoContent)
}
