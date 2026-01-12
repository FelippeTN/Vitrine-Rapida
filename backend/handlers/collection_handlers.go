package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func getUserIDFromContext(c *gin.Context) (uint, bool) {
	v, ok := c.Get("user_id")
	if !ok || v == nil {
		return 0, false
	}

	switch value := v.(type) {
	case uint:
		return value, true
	case int:
		if value < 0 {
			return 0, false
		}
		return uint(value), true
	case int64:
		if value < 0 {
			return 0, false
		}
		return uint(value), true
	case float64:
		if value < 0 {
			return 0, false
		}
		return uint(value), true
	case string:
		parsed, err := strconv.ParseUint(value, 10, 64)
		if err != nil {
			return 0, false
		}
		return uint(parsed), true
	default:
		return 0, false
	}
}

func CreateCollection(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	canCreate, plan, currentCount, err := CheckCollectionLimit(ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not verify plan limits"})
		return
	}
	if !canCreate {
		c.JSON(http.StatusForbidden, gin.H{
			"error":            "Collection limit reached",
			"limit":            plan.MaxCollections,
			"current_count":    currentCount,
			"plan_name":        plan.DisplayName,
			"upgrade_required": true,
		})
		return
	}

	var input models.CreateCollectionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	collection := models.Collection{
		OwnerID:     ownerID,
		Name:        input.Name,
		Description: input.Description,
	}

	if err := database.DB.Create(&collection).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create collection"})
		return
	}

	c.JSON(http.StatusCreated, collection)
}

func GetMyCollections(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var collections []models.Collection
	if err := database.DB.Where("owner_id = ?", ownerID).Order("created_at desc").Find(&collections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve collections"})
		return
	}

	c.JSON(http.StatusOK, collections)
}

func UpdateCollection(c *gin.Context) {
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

	var input models.UpdateCollectionInput
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

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	result := database.DB.Model(&models.Collection{}).
		Where("id = ? AND owner_id = ?", uint(id), ownerID).
		Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update collection"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}

	var updated models.Collection
	if err := database.DB.Where("id = ? AND owner_id = ?", uint(id), ownerID).First(&updated).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve updated collection"})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func DeleteCollection(c *gin.Context) {
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

	collectionID := uint(id)

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		var collection models.Collection
		if err := tx.Where("id = ? AND owner_id = ?", collectionID, ownerID).First(&collection).Error; err != nil {
			return err
		}

		var productIDs []uint
		if err := tx.Model(&models.Product{}).Where("owner_id = ? AND collection_id = ?", ownerID, collectionID).Pluck("id", &productIDs).Error; err != nil {
			return err
		}

		if len(productIDs) > 0 {
			if err := tx.Where("product_id IN ?", productIDs).Delete(&models.ProductImage{}).Error; err != nil {
				return err
			}
		}

		if err := tx.Where("owner_id = ? AND collection_id = ?", ownerID, collectionID).Delete(&models.Product{}).Error; err != nil {
			return err
		}

		if err := tx.Where("id = ? AND owner_id = ?", collectionID, ownerID).Delete(&models.Collection{}).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not delete collection"})
		return
	}

	c.Status(http.StatusNoContent)
}

func GetPublicCollections(c *gin.Context) {
	ownerIDRaw := c.Query("owner_id")
	if ownerIDRaw == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "owner_id is required"})
		return
	}

	ownerIDParsed, err := strconv.ParseUint(ownerIDRaw, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid owner_id"})
		return
	}

	var collections []models.Collection
	if err := database.DB.Where("owner_id = ?", uint(ownerIDParsed)).Order("created_at desc").Find(&collections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve collections"})
		return
	}

	c.JSON(http.StatusOK, collections)
}
