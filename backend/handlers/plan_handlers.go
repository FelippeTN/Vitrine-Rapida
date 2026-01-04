package handlers

import (
	"net/http"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/gin-gonic/gin"
)

func GetPlans(c *gin.Context) {
	var plans []models.Plan
	if err := database.DB.Where("is_active = ?", true).Order("price ASC").Find(&plans).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve plans"})
		return
	}
	c.JSON(http.StatusOK, plans)
}

func GetMyPlanInfo(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := database.DB.Preload("Plan").First(&user, ownerID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve user"})
		return
	}

	if user.Plan == nil {
		var freePlan models.Plan
		if err := database.DB.Where("name = ?", "free").First(&freePlan).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not find default plan"})
			return
		}
		user.PlanID = freePlan.ID
		database.DB.Save(&user)
		user.Plan = &freePlan
	}

	var productCount int64
	database.DB.Model(&models.Product{}).Where("owner_id = ?", ownerID).Count(&productCount)

	var collectionCount int64
	database.DB.Model(&models.Collection{}).Where("owner_id = ?", ownerID).Count(&collectionCount)

	canCreateProduct := user.Plan.MaxProducts == -1 || int(productCount) < user.Plan.MaxProducts
	canCreateCollection := user.Plan.MaxCollections == -1 || int(collectionCount) < user.Plan.MaxCollections

	planInfo := models.UserPlanInfo{
		Plan:                *user.Plan,
		ProductCount:        int(productCount),
		CollectionCount:     int(collectionCount),
		CanCreateProduct:    canCreateProduct,
		CanCreateCollection: canCreateCollection,
	}

	c.JSON(http.StatusOK, planInfo)
}

func CheckProductLimit(ownerID uint) (bool, *models.Plan, int, error) {
	var user models.User
	if err := database.DB.Preload("Plan").First(&user, ownerID).Error; err != nil {
		return false, nil, 0, err
	}

	if user.Plan == nil {
		var freePlan models.Plan
		if err := database.DB.Where("name = ?", "free").First(&freePlan).Error; err != nil {
			return false, nil, 0, err
		}
		user.Plan = &freePlan
	}

	var productCount int64
	database.DB.Model(&models.Product{}).Where("owner_id = ?", ownerID).Count(&productCount)

	canCreate := user.Plan.MaxProducts == -1 || int(productCount) < user.Plan.MaxProducts
	return canCreate, user.Plan, int(productCount), nil
}

func CheckCollectionLimit(ownerID uint) (bool, *models.Plan, int, error) {
	var user models.User
	if err := database.DB.Preload("Plan").First(&user, ownerID).Error; err != nil {
		return false, nil, 0, err
	}

	if user.Plan == nil {
		var freePlan models.Plan
		if err := database.DB.Where("name = ?", "free").First(&freePlan).Error; err != nil {
			return false, nil, 0, err
		}
		user.Plan = &freePlan
	}

	var collectionCount int64
	database.DB.Model(&models.Collection{}).Where("owner_id = ?", ownerID).Count(&collectionCount)

	canCreate := user.Plan.MaxCollections == -1 || int(collectionCount) < user.Plan.MaxCollections
	return canCreate, user.Plan, int(collectionCount), nil
}

func UpgradePlan(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		PlanID uint `json:"plan_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var plan models.Plan
	if err := database.DB.First(&plan, input.PlanID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plan not found"})
		return
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", ownerID).Update("plan_id", input.PlanID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not upgrade plan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Plan upgraded successfully",
		"plan":    plan,
	})
}
