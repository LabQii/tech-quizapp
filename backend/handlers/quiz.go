package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"quizapp/db"
	"quizapp/models"

	"github.com/gin-gonic/gin"
)

func GetQuizzes(c *gin.Context) {
	role, _ := c.Get("role")
	roleStr, _ := role.(string)

	query := `SELECT q.id, q.name, q.is_archived, q.created_at, COUNT(quest.id) as question_count 
			 FROM quizzes q 
			 LEFT JOIN questions quest ON q.id = quest.quiz_id 
			 GROUP BY q.id 
			 ORDER BY q.id`

	rows, err := db.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch quizzes"})
		return
	}
	defer rows.Close()

	var quizzes []models.Quiz
	for rows.Next() {
		var q models.Quiz
		if err := rows.Scan(&q.ID, &q.Name, &q.IsArchived, &q.CreatedAt, &q.QuestionCount); err != nil {
			continue
		}
		showAll := c.Query("all") == "true"
		if q.IsArchived {
			if roleStr != "admin" || !showAll {
				continue
			}
		}
		quizzes = append(quizzes, q)
	}

	c.JSON(http.StatusOK, gin.H{"quizzes": quizzes})
}

func ToggleArchive(c *gin.Context) {
	id := c.Param("id")
	_, err := db.DB.Exec("UPDATE quizzes SET is_archived = CASE WHEN is_archived IS TRUE THEN FALSE ELSE TRUE END WHERE id = $1", id)
	if err != nil {
		fmt.Printf("Error toggling archive for quiz %s: %v\n", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal di database: %v", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Archive status updated"})
}

func GetQuiz(c *gin.Context) {
	id := c.Param("id")
	var quiz models.Quiz
	err := db.DB.QueryRow(
		`SELECT id, name, created_at FROM quizzes WHERE id = $1`, id,
	).Scan(&quiz.ID, &quiz.Name, &quiz.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
		return
	}

	role, _ := c.Get("role")

	rows, err := db.DB.Query(
		`SELECT id, quiz_id, text, options, correct_answer, point FROM questions WHERE quiz_id = $1 ORDER BY id`,
		quiz.ID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch questions"})
		return
	}
	defer rows.Close()

	var questions []models.Question
	for rows.Next() {
		var q models.Question
		var optionsRaw []byte
		if err := rows.Scan(&q.ID, &q.QuizID, &q.Text, &optionsRaw, &q.CorrectAnswer, &q.Point); err != nil {
			continue
		}
		if err := json.Unmarshal(optionsRaw, &q.Options); err != nil {
			continue
		}

		if role != "admin" {
			q.CorrectAnswer = ""
		}

		questions = append(questions, q)
	}

	c.JSON(http.StatusOK, gin.H{
		"quiz":      quiz,
		"questions": questions,
	})
}

func UpdateQuiz(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := db.DB.Exec("UPDATE quizzes SET name = $1 WHERE id = $2", input.Name, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update quiz"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiz updated successfully"})
}

func DeleteQuiz(c *gin.Context) {
	id := c.Param("id")

	_, err := db.DB.Exec("DELETE FROM quizzes WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete quiz"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiz deleted successfully"})
}

func CreateQuiz(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var id int
	err := db.DB.QueryRow("INSERT INTO quizzes (name) VALUES ($1) RETURNING id", input.Name).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create quiz"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "name": input.Name})
}