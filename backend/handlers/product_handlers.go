package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/gin-gonic/gin"
)

func CreateProduct(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input models.CreateProductInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	file, err := c.FormFile("image")
	if err == nil {
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		path := filepath.Join("uploads", filename)

		if err := c.SaveUploadedFile(file, path); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save image"})
			return
		}

		imageURL := "/uploads/" + filename
		input.ImageURL = &imageURL
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
		ImageURL:     input.ImageURL,
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

	var input models.UpdateProductInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	file, err := c.FormFile("image")
	if err == nil {
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		path := filepath.Join("uploads", filename)

		if err := c.SaveUploadedFile(file, path); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save image"})
			return
		}

		imageURL := "/uploads/" + filename
		input.ImageURL = &imageURL
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
	if input.ImageURL != nil {
		updates["image_url"] = *input.ImageURL
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
