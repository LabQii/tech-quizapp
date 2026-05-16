package handlers

import (
	"net/http"
	"quizapp/db"
	"quizapp/models"

	"github.com/gin-gonic/gin"
)

func GetDashboardStats(c *gin.Context) {
	var totalUsers int
	var totalQuizzes int
	var totalAttempts int

	db.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
	db.DB.QueryRow("SELECT COUNT(*) FROM quizzes").Scan(&totalQuizzes)
	db.DB.QueryRow("SELECT COUNT(*) FROM attempts").Scan(&totalAttempts)

	c.JSON(http.StatusOK, gin.H{
		"total_users":    totalUsers,
		"total_quizzes":  totalQuizzes,
		"total_attempts": totalAttempts,
	})
}

func GetAllAttempts(c *gin.Context) {
	rows, err := db.DB.Query(
		`SELECT a.id, a.quiz_id, q.name as quiz_name, a.email, a.name, a.score, a.max_score, a.percentage, a.category, a.created_at
		 FROM attempts a JOIN quizzes q ON a.quiz_id = q.id
		 ORDER BY a.created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attempts"})
		return
	}
	defer rows.Close()

	var attempts []models.Attempt
	for rows.Next() {
		var a models.Attempt
		rows.Scan(
			&a.ID, &a.QuizID, &a.QuizName,
			&a.Email, &a.Name,
			&a.Score, &a.MaxScore, &a.Percentage,
			&a.Category, &a.CreatedAt,
		)
		attempts = append(attempts, a)
	}

	c.JSON(http.StatusOK, gin.H{"attempts": attempts})
}

func GetAllUsers(c *gin.Context) {
	rows, err := db.DB.Query("SELECT id, username, full_name, email, role FROM users ORDER BY id DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		rows.Scan(&u.ID, &u.Username, &u.FullName, &u.Email, &u.Role)
		users = append(users, u)
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}
