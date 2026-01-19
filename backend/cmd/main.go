package main

import (
	"time"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/handlers"
	"github.com/FelippeTN/Web-Catalogo/backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.ConnectDatabase()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://localhost",
			"http://127.0.0.1",
			"http://72.62.142.229",
			"http://72.62.142.229:3000",
			"http://72.62.142.229:8081",
			"https://vitrinerapida.com.br",
       		"http://vitrinerapida.com.br",
			"https://vitrinerapida.com.br",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Static("/uploads", "./uploads")

	publicRoutes := r.Group("/public")
	{
		publicRoutes.POST("/login", handlers.Login)
		publicRoutes.POST("/register", handlers.Register)
		publicRoutes.GET("/products", handlers.GetProducts)
		publicRoutes.GET("/collections", handlers.GetPublicCollections)
		publicRoutes.GET("/catalogs/:token", handlers.GetPublicCatalogByToken)
		publicRoutes.GET("/plans", handlers.GetPlans)
	}

	protectedRoutes := r.Group("/protected")
	protectedRoutes.Use(middleware.AuthenticationMiddleware())
	{
		protectedRoutes.GET("/my-plan", handlers.GetMyPlanInfo)
		protectedRoutes.POST("/upgrade-plan", handlers.UpgradePlan)

		protectedRoutes.POST("/collections", handlers.CreateCollection)
		protectedRoutes.GET("/collections", handlers.GetMyCollections)
		protectedRoutes.PUT("/collections/:id", handlers.UpdateCollection)
		protectedRoutes.DELETE("/collections/:id", handlers.DeleteCollection)
		protectedRoutes.POST("/collections/:id/share", handlers.ShareCollection)

		protectedRoutes.POST("/products", handlers.CreateProduct)
		protectedRoutes.GET("/products", handlers.GetMyProducts)
		protectedRoutes.PUT("/products/:id", handlers.UpdateProduct)
		protectedRoutes.DELETE("/products/:id", handlers.DeleteProduct)
		protectedRoutes.POST("/create-payment-intent", handlers.CreatePaymentIntent)
	}

	r.Run(":8080")
}
