package handlers

import (
	"fmt"
	"net/http"
	"os"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"
	"github.com/stripe/stripe-go/v74/customer"
	stripeSub "github.com/stripe/stripe-go/v74/subscription"
)

func init() {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
}

// getOrCreateStripeCustomer finds or creates a Stripe customer for the user
func getOrCreateStripeCustomer(user *models.User) (string, error) {
	if user.StripeCustomerID != "" {
		return user.StripeCustomerID, nil
	}

	params := &stripe.CustomerParams{
		Email: stripe.String(user.Email),
		Name:  stripe.String(user.Username),
		Params: stripe.Params{
			Metadata: map[string]string{
				"user_id": fmt.Sprintf("%d", user.ID),
			},
		},
	}

	c, err := customer.New(params)
	if err != nil {
		return "", err
	}

	// Save Stripe customer ID to user
	database.DB.Model(user).Update("stripe_customer_id", c.ID)
	return c.ID, nil
}

type CreateCheckoutInput struct {
	PlanID uint `json:"plan_id" binding:"required"`
}

// CreateCheckoutSession creates a Stripe Checkout session for subscription
func CreateCheckoutSession(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input CreateCheckoutInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Get the plan
	var plan models.Plan
	if err := database.DB.First(&plan, input.PlanID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plan not found"})
		return
	}

	if plan.StripePriceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This plan does not support subscription"})
		return
	}

	// Get the user
	var user models.User
	if err := database.DB.First(&user, ownerID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	// Get or create Stripe customer
	customerID, err := getOrCreateStripeCustomer(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create Stripe customer"})
		return
	}

	// Determine return URLs
	successURL := os.Getenv("FRONTEND_URL")
	if successURL == "" {
		successURL = "https://vitrinerapida.com.br"
	}
	cancelURL := successURL + "/plans"
	successURL = successURL + "/plans?success=true"

	// Create checkout session
	params := &stripe.CheckoutSessionParams{
		Customer: stripe.String(customerID),
		Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(plan.StripePriceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
		Params: stripe.Params{
			Metadata: map[string]string{
				"user_id": fmt.Sprintf("%d", user.ID),
				"plan_id": fmt.Sprintf("%d", plan.ID),
			},
		},
	}

	s, err := session.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create checkout session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": s.URL})
}

// CancelSubscription cancels the user's active Stripe subscription
func CancelSubscription(c *gin.Context) {
	ownerID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, ownerID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	if user.StripeSubscriptionID == "" {
		// No active subscription, just revert to free plan
		var freePlan models.Plan
		if err := database.DB.Where("name = ?", "free").First(&freePlan).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not find free plan"})
			return
		}

		database.DB.Model(&user).Updates(map[string]interface{}{
			"plan_id":             freePlan.ID,
			"subscription_status": "none",
			"plan_expires_at":     nil,
		})

		c.JSON(http.StatusOK, gin.H{
			"message": "Plan cancelled successfully",
			"plan":    freePlan,
		})
		return
	}

	// Cancel on Stripe - the webhook will handle reverting to free plan
	_, err := stripeSub.Cancel(user.StripeSubscriptionID, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not cancel subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Subscription cancellation initiated",
	})
}
