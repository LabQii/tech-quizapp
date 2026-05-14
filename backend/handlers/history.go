package handlers

import (
	"net/http"
	"quizapp/db"
	"quizapp/models"

	"github.com/gin-gonic/gin"
)

func GetHistory(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email query param is required"})
		return
	}

	rows, err := db.DB.Query(
		`SELECT a.id, a.quiz_id, q.name, a.email, a.name, a.score, a.max_score, a.percentage, a.category, a.created_at
		 FROM attempts a JOIN quizzes q ON a.quiz_id = q.id
		 WHERE a.email = $1
		 ORDER BY a.created_at DESC`,
		email,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}
	defer rows.Close()

	var attempts []models.Attempt = []models.Attempt{}
	for rows.Next() {
		var a models.Attempt
		err := rows.Scan(
			&a.ID, &a.QuizID, &a.QuizName,
			&a.Email, &a.Name,
			&a.Score, &a.MaxScore, &a.Percentage,
			&a.Category, &a.CreatedAt,
		)
		if err != nil {
			continue
		}
		attempts = append(attempts, a)
	}

	c.JSON(http.StatusOK, gin.H{
		"email":    email,
		"attempts": attempts,
	})
}