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
		},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		MaxAge:       12 * time.Hour,
	}))

	publicRoutes := r.Group("/public")
	{
		publicRoutes.POST("/login", handlers.Login)
		publicRoutes.POST("/register", handlers.Register)
		publicRoutes.GET("/products", handlers.GetProducts)
		publicRoutes.GET("/collections", handlers.GetPublicCollections)
	}

	protectedRoutes := r.Group("/protected")
	protectedRoutes.Use(middleware.AuthenticationMiddleware())
	{
		protectedRoutes.POST("/collections", handlers.CreateCollection)
		protectedRoutes.GET("/collections", handlers.GetMyCollections)
		protectedRoutes.PUT("/collections/:id", handlers.UpdateCollection)
		protectedRoutes.DELETE("/collections/:id", handlers.DeleteCollection)

		protectedRoutes.POST("/products", handlers.CreateProduct)
		protectedRoutes.GET("/products", handlers.GetMyProducts)
		protectedRoutes.PUT("/products/:id", handlers.UpdateProduct)
		protectedRoutes.DELETE("/products/:id", handlers.DeleteProduct)
	}

	r.Run(":8080")
}
