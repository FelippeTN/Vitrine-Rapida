package handlers

import (
	"fmt"
	"net/http"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func CreateOrder(c *gin.Context) {
	var input models.CreateOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	if len(input.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "O pedido deve ter pelo menos um item"})
		return
	}

	orderToken := uuid.New().String()
	var total float64
	var orderItems []models.OrderItem

	// Start transaction
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		for _, itemInput := range input.Items {
			var product models.Product
			// Get product to calculate price
			if err := tx.First(&product, itemInput.ProductID).Error; err != nil {
				return fmt.Errorf("produto não encontrado (ID: %d)", itemInput.ProductID)
			}

			orderItem := models.OrderItem{
				ProductID: product.ID,
				Quantity:  itemInput.Quantity,
				Size:      itemInput.Size,
				Price:     product.Price,
			}
			orderItems = append(orderItems, orderItem)
			total += product.Price * float64(itemInput.Quantity)
		}

		order := models.Order{
			OrderToken:   orderToken,
			Total:        total,
			Items:        orderItems,
			// We can add Customer info later if needed
		}

		if err := tx.Create(&order).Error; err != nil {
			return fmt.Errorf("erro ao criar pedido")
		}

		return nil
	})

	if err != nil {
		// Return 409 Conflict for stock issues, or 400/500 depending on error
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Pedido criado com sucesso",
		"order_token": orderToken,
		"total":       total,
	})
}
