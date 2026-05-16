package main

import (
	"log"
	"os"
	"quizapp/db"
	"quizapp/handlers"
	"quizapp/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	db.Connect()
	db.Migrate()
	db.Seed()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL"), "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS", "PUT", "DELETE"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
	{
		// Public Routes
		api.POST("/login", handlers.Login)
		api.POST("/register", handlers.Register)
		api.GET("/quizzes", handlers.GetQuizzes)
		api.GET("/quiz/:id", handlers.GetQuiz)

		// Public/User Routes (Harus Login)
		auth := api.Group("/")
		auth.Use(middleware.AuthMiddleware())
		{
			auth.GET("/me", handlers.Me)
			auth.POST("/submit", handlers.SubmitQuiz)
			auth.GET("/result/:id", handlers.GetResult)
			auth.GET("/history", handlers.GetHistory)
			auth.POST("/export-pdf", handlers.ExportPDF)
		}

		// Admin Routes (Harus Admin)
		admin := auth.Group("/")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.POST("/quiz", handlers.CreateQuiz)
			admin.PUT("/quiz/:id", handlers.UpdateQuiz)
			admin.DELETE("/quiz/:id", handlers.DeleteQuiz)
			
			admin.POST("/question", handlers.CreateQuestion)
			admin.PUT("/question/:id", handlers.UpdateQuestion)
			admin.DELETE("/question/:id", handlers.DeleteQuestion)
		}
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	r.Run(":" + port)
}