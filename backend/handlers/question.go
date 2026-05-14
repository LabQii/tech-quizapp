package handlers

import (
	"encoding/json"
	"net/http"
	"quizapp/db"

	"github.com/gin-gonic/gin"
)

func UpdateQuestion(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Text          string            `json:"text" binding:"required"`
		Options       map[string]string `json:"options" binding:"required"`
		CorrectAnswer string            `json:"correct_answer" binding:"required"`
		Point         int               `json:"point" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	optJSON, _ := json.Marshal(input.Options)

	_, err := db.DB.Exec(
		`UPDATE questions 
		 SET text = $1, options = $2, correct_answer = $3, point = $4 
		 WHERE id = $5`,
		input.Text, optJSON, input.CorrectAnswer, input.Point, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Question updated successfully"})
}

func DeleteQuestion(c *gin.Context) {
	id := c.Param("id")

	_, err := db.DB.Exec("DELETE FROM questions WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Question deleted successfully"})
}

func CreateQuestion(c *gin.Context) {
	var input struct {
		QuizID        int               `json:"quiz_id" binding:"required"`
		Text          string            `json:"text" binding:"required"`
		Options       map[string]string `json:"options" binding:"required"`
		CorrectAnswer string            `json:"correct_answer" binding:"required"`
		Point         int               `json:"point" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	optJSON, _ := json.Marshal(input.Options)

	var id int
	err := db.DB.QueryRow(
		`INSERT INTO questions (quiz_id, text, options, correct_answer, point) 
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		input.QuizID, input.Text, optJSON, input.CorrectAnswer, input.Point,
	).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Question created successfully"})
}
