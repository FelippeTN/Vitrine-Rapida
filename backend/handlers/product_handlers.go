package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/FelippeTN/Web-Catalogo/backend/utils"
	"github.com/gin-gonic/gin"
)

func CreateProduct(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	canCreate, plan, currentCount, err := CheckProductLimit(ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not verify plan limits"})
		return
	}
	if !canCreate {
		c.JSON(http.StatusForbidden, gin.H{
			"error":            "Product limit reached",
			"limit":            plan.MaxProducts,
			"current_count":    currentCount,
			"plan_name":        plan.DisplayName,
			"upgrade_required": true,
		})
		return
	}

	var input models.CreateProductInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	// Handle multiple images
	form, _ := c.MultipartForm()
	var uploadedImages []string

	if form != nil && form.File["images"] != nil {
		files := form.File["images"]
		for _, file := range files {
			if file.Size > 10*1024*1024 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "O tamanho da imagem excede o limite de 10MB"})
				return
			}
			baseFilename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), strconv.Itoa(len(uploadedImages)))
			jpgFilename := baseFilename + ".jpg"
			jpgPath := filepath.Join("uploads", jpgFilename)

			if err := utils.SaveCompressedImage(file, jpgPath); err == nil {
				uploadedImages = append(uploadedImages, "/uploads/"+jpgFilename)
			} else {
				ext := filepath.Ext(file.Filename)
				filename := baseFilename + ext
				path := filepath.Join("uploads", filename)

				if err := c.SaveUploadedFile(file, path); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save image"})
					return
				}
				uploadedImages = append(uploadedImages, "/uploads/"+filename)
			}
		}
	}

	if len(uploadedImages) == 0 {
		file, err := c.FormFile("image")
		if err == nil {
			if file.Size > 10*1024*1024 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "O tamanho da imagem excede o limite de 10MB"})
				return
			}
			baseFilename := fmt.Sprintf("%d", time.Now().UnixNano())
			jpgFilename := baseFilename + ".jpg"
			jpgPath := filepath.Join("uploads", jpgFilename)

			if err := utils.SaveCompressedImage(file, jpgPath); err == nil {
				uploadedImages = append(uploadedImages, "/uploads/"+jpgFilename)
			} else {
				ext := filepath.Ext(file.Filename)
				filename := baseFilename + ext
				path := filepath.Join("uploads", filename)

				if err := c.SaveUploadedFile(file, path); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save image"})
					return
				}
				uploadedImages = append(uploadedImages, "/uploads/"+filename)
			}
		}
	}

	if input.CollectionID != nil {
		var collection models.Collection
		if err := database.DB.Where("id = ? AND owner_id = ?", *input.CollectionID, ownerID).First(&collection).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection_id"})
			return
		}
	}

	var mainImageURL *string
	if len(uploadedImages) > 0 {
		mainImageURL = &uploadedImages[0]
	}

	product := models.Product{
		OwnerID:      ownerID,
		CollectionID: input.CollectionID,
		Name:         input.Name,
		Description:  input.Description,
		Price:        input.Price,
		Sizes:        input.Sizes,
		ImageURL:     mainImageURL,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create product"})
		return
	}

	for i, imgURL := range uploadedImages {
		productImage := models.ProductImage{
			ProductID: product.ID,
			ImageURL:  imgURL,
			Position:  i,
		}
		database.DB.Create(&productImage)
	}

	database.DB.Preload("Images").First(&product, product.ID)

	c.JSON(http.StatusCreated, product)
}

func GetProducts(c *gin.Context) {
	var products []models.Product

	query := database.DB.Model(&models.Product{}).Preload("Images")
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
	if err := database.DB.Preload("Images").Where("owner_id = ?", ownerID).Order("created_at desc").Find(&products).Error; err != nil {
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

	deleteImageIDsStr := c.PostFormArray("delete_image_ids")
	var deleteImageIDs []uint
	for _, idStr := range deleteImageIDsStr {
		imgID, err := strconv.ParseUint(idStr, 10, 64)
		if err == nil {
			deleteImageIDs = append(deleteImageIDs, uint(imgID))
		}
	}

	if len(deleteImageIDs) > 0 {
		database.DB.Where("id IN ? AND product_id = ?", deleteImageIDs, uint(id)).Delete(&models.ProductImage{})
	}

	form, _ := c.MultipartForm()
	var uploadedImages []string

	if form != nil && form.File["images"] != nil {
		files := form.File["images"]
		for i, file := range files {
			if file.Size > 10*1024*1024 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "O tamanho da imagem excede o limite de 10MB"})
				return
			}
			baseFilename := fmt.Sprintf("%d_%d", time.Now().UnixNano(), i)
			jpgFilename := baseFilename + ".jpg"
			jpgPath := filepath.Join("uploads", jpgFilename)

			if err := utils.SaveCompressedImage(file, jpgPath); err == nil {
				uploadedImages = append(uploadedImages, "/uploads/"+jpgFilename)
			} else {
				// Fallback
				ext := filepath.Ext(file.Filename)
				filename := baseFilename + ext
				path := filepath.Join("uploads", filename)

				if err := c.SaveUploadedFile(file, path); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save image"})
					return
				}
				uploadedImages = append(uploadedImages, "/uploads/"+filename)
			}
		}
	}

	if len(uploadedImages) == 0 {
		file, err := c.FormFile("image")
		if err == nil {
			if file.Size > 10*1024*1024 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "O tamanho da imagem excede o limite de 10MB"})
				return
			}
			baseFilename := fmt.Sprintf("%d", time.Now().UnixNano())
			jpgFilename := baseFilename + ".jpg"
			jpgPath := filepath.Join("uploads", jpgFilename)

			if err := utils.SaveCompressedImage(file, jpgPath); err == nil {
				uploadedImages = append(uploadedImages, "/uploads/"+jpgFilename)
			} else {
				// Fallback
				ext := filepath.Ext(file.Filename)
				filename := baseFilename + ext
				path := filepath.Join("uploads", filename)

				if err := c.SaveUploadedFile(file, path); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save image"})
					return
				}
				uploadedImages = append(uploadedImages, "/uploads/"+filename)
			}
		}
	}

	var maxPosition int
	database.DB.Model(&models.ProductImage{}).Where("product_id = ?", uint(id)).Select("COALESCE(MAX(position), -1)").Scan(&maxPosition)

	for i, imgURL := range uploadedImages {
		productImage := models.ProductImage{
			ProductID: uint(id),
			ImageURL:  imgURL,
			Position:  maxPosition + 1 + i,
		}
		database.DB.Create(&productImage)
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
	if input.Sizes != nil {
		updates["sizes"] = *input.Sizes
	}
	if input.CollectionID != nil {
		updates["collection_id"] = *input.CollectionID
	}

	var firstImage models.ProductImage
	if err := database.DB.Where("product_id = ?", uint(id)).Order("position asc").First(&firstImage).Error; err == nil {
		updates["image_url"] = firstImage.ImageURL
	}

	if len(updates) > 0 {
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
	}

	var updated models.Product
	if err := database.DB.Preload("Images").Where("id = ? AND owner_id = ?", uint(id), ownerID).First(&updated).Error; err != nil {
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

	database.DB.Where("product_id = ?", uint(id)).Delete(&models.ProductImage{})

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
