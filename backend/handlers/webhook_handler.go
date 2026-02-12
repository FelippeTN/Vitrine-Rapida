package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/webhook"
)

// HandleStripeWebhook processes incoming Stripe webhook events
func HandleStripeWebhook(c *gin.Context) {
	const MaxBodyBytes = int64(65536)
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxBodyBytes)

	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Webhook error reading body: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Error reading request body"})
		return
	}

	endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	event, err := webhook.ConstructEventWithOptions(payload, c.GetHeader("Stripe-Signature"), endpointSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		log.Printf("Webhook signature verification failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		handleCheckoutCompleted(event)
	case "invoice.payment_succeeded":
		handleInvoicePaymentSucceeded(event)
	case "invoice.payment_failed":
		handleInvoicePaymentFailed(event)
	case "customer.subscription.updated":
		handleSubscriptionUpdated(event)
	case "customer.subscription.deleted":
		handleSubscriptionDeleted(event)
	default:
		log.Printf("Unhandled webhook event type: %s", event.Type)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

// handleCheckoutCompleted activates the user's plan after successful checkout
func handleCheckoutCompleted(event stripe.Event) {
	var session struct {
		Customer     string `json:"customer"`
		Subscription string `json:"subscription"`
		Metadata     map[string]string `json:"metadata"`
	}

	if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
		log.Printf("Error parsing checkout.session.completed: %v", err)
		return
	}

	userID := session.Metadata["user_id"]
	planID := session.Metadata["plan_id"]
	if userID == "" || planID == "" {
		log.Printf("Missing metadata in checkout session: user_id=%s, plan_id=%s", userID, planID)
		return
	}

	// Update user with subscription info
	result := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"stripe_customer_id":     session.Customer,
		"stripe_subscription_id": session.Subscription,
		"plan_id":                planID,
		"subscription_status":    "active",
		"plan_expires_at":        time.Now().AddDate(0, 1, 0), // +1 month
	})

	if result.Error != nil {
		log.Printf("Error updating user after checkout: %v", result.Error)
		return
	}

	log.Printf("Checkout completed: user=%s plan=%s subscription=%s", userID, planID, session.Subscription)
}

// handleInvoicePaymentSucceeded renews the plan on successful recurring payment
func handleInvoicePaymentSucceeded(event stripe.Event) {
	var invoice struct {
		Customer     string `json:"customer"`
		Subscription string `json:"subscription"`
	}

	if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
		log.Printf("Error parsing invoice.payment_succeeded: %v", err)
		return
	}

	if invoice.Subscription == "" {
		return // Not a subscription invoice
	}

	result := database.DB.Model(&models.User{}).
		Where("stripe_customer_id = ?", invoice.Customer).
		Updates(map[string]interface{}{
			"subscription_status": "active",
			"plan_expires_at":     time.Now().AddDate(0, 1, 0),
		})

	if result.Error != nil {
		log.Printf("Error updating user after invoice payment: %v", result.Error)
		return
	}

	log.Printf("Invoice payment succeeded for customer: %s", invoice.Customer)
}

// handleInvoicePaymentFailed marks the subscription as past_due
func handleInvoicePaymentFailed(event stripe.Event) {
	var invoice struct {
		Customer     string `json:"customer"`
		Subscription string `json:"subscription"`
	}

	if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
		log.Printf("Error parsing invoice.payment_failed: %v", err)
		return
	}

	if invoice.Subscription == "" {
		return
	}

	result := database.DB.Model(&models.User{}).
		Where("stripe_customer_id = ?", invoice.Customer).
		Update("subscription_status", "past_due")

	if result.Error != nil {
		log.Printf("Error updating user after payment failure: %v", result.Error)
		return
	}

	log.Printf("Invoice payment failed for customer: %s", invoice.Customer)
}

// handleSubscriptionUpdated syncs the subscription status
func handleSubscriptionUpdated(event stripe.Event) {
	var sub struct {
		ID       string `json:"id"`
		Customer string `json:"customer"`
		Status   string `json:"status"`
	}

	if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
		log.Printf("Error parsing customer.subscription.updated: %v", err)
		return
	}

	result := database.DB.Model(&models.User{}).
		Where("stripe_customer_id = ?", sub.Customer).
		Update("subscription_status", sub.Status)

	if result.Error != nil {
		log.Printf("Error updating subscription status: %v", result.Error)
		return
	}

	log.Printf("Subscription updated: customer=%s status=%s", sub.Customer, sub.Status)
}

// handleSubscriptionDeleted reverts user to free plan
func handleSubscriptionDeleted(event stripe.Event) {
	var sub struct {
		ID       string `json:"id"`
		Customer string `json:"customer"`
	}

	if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
		log.Printf("Error parsing customer.subscription.deleted: %v", err)
		return
	}

	// Find free plan
	var freePlan models.Plan
	if err := database.DB.Where("name = ?", "free").First(&freePlan).Error; err != nil {
		log.Printf("Error finding free plan: %v", err)
		return
	}

	result := database.DB.Model(&models.User{}).
		Where("stripe_customer_id = ?", sub.Customer).
		Updates(map[string]interface{}{
			"plan_id":                freePlan.ID,
			"stripe_subscription_id": "",
			"subscription_status":    "canceled",
			"plan_expires_at":        nil,
		})

	if result.Error != nil {
		log.Printf("Error reverting user to free plan: %v", result.Error)
		return
	}

	log.Printf("Subscription deleted: customer=%s reverted to free plan", sub.Customer)
}
