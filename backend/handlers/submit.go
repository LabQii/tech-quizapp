package handlers

import (

	"fmt"
	"net/http"
	"quizapp/db"
	"quizapp/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func SubmitQuiz(c *gin.Context) {
	var req models.SubmitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rows, err := db.DB.Query(
		`SELECT id, text, correct_answer, point FROM questions WHERE quiz_id = $1 ORDER BY id`,
		req.QuizID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch questions"})
		return
	}
	defer rows.Close()

	type questionData struct {
		ID            int
		Text          string
		CorrectAnswer string
		Point         int
	}

	var allQuestions []questionData
	for rows.Next() {
		var q questionData
		rows.Scan(&q.ID, &q.Text, &q.CorrectAnswer, &q.Point)
		allQuestions = append(allQuestions, q)
	}

	totalScore := 0
	maxScore := 0
	var answerResults []models.AnswerResult

	for _, q := range allQuestions {
		maxScore += q.Point
		qIDStr := strconv.Itoa(q.ID)
		userAnswer := req.Answers[qIDStr]
		isCorrect := userAnswer == q.CorrectAnswer
		earned := 0
		if isCorrect {
			earned = q.Point
			totalScore += q.Point
		}
		answerResults = append(answerResults, models.AnswerResult{
			QuestionID:    q.ID,
			QuestionText:  q.Text,
			UserAnswer:    userAnswer,
			CorrectAnswer: q.CorrectAnswer,
			IsCorrect:     isCorrect,
			Point:         q.Point,
			EarnedPoint:   earned,
		})
	}

	percentage := 0.0
	if maxScore > 0 {
		percentage = float64(totalScore) / float64(maxScore) * 100
	}

	category := getCategory(percentage)
	insights := generateInsights(percentage, answerResults)

	var attemptID int
	err = db.DB.QueryRow(
		`INSERT INTO attempts (quiz_id, email, name, score, max_score, percentage, category)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		req.QuizID, req.Email, req.Name, totalScore, maxScore, percentage, category,
	).Scan(&attemptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save attempt"})
		return
	}

	for _, ar := range answerResults {
		db.DB.Exec(
			`INSERT INTO answers (attempt_id, question_id, user_answer, is_correct)
			 VALUES ($1, $2, $3, $4)`,
			attemptID, ar.QuestionID, ar.UserAnswer, ar.IsCorrect,
		)
	}

	c.JSON(http.StatusOK, gin.H{
		"attempt_id": attemptID,
		"name":       req.Name,
		"email":      req.Email,
		"score":      totalScore,
		"max_score":  maxScore,
		"percentage": percentage,
		"category":   category,
		"insights":   insights,
		"answers":    answerResults,
	})
}

func getCategory(percentage float64) string {
	switch {
	case percentage >= 80:
		return "Advanced"
	case percentage >= 50:
		return "Intermediate"
	default:
		return "Beginner"
	}
}

func generateInsights(percentage float64, answers []models.AnswerResult) []string {
	insights := []string{}
	correct := 0
	for _, a := range answers {
		if a.IsCorrect {
			correct++
		}
	}
	total := len(answers)
	wrong := total - correct

	insights = append(insights, fmt.Sprintf("Kamu menjawab benar %d dari %d soal.", correct, total))

	if percentage == 100 {
		insights = append(insights, "Sempurna! Kamu menjawab semua soal dengan benar.")
	} else if percentage >= 80 {
		insights = append(insights, "Hasil yang sangat baik! Tingkatkan terus kemampuanmu.")
	} else if percentage >= 50 {
		insights = append(insights, fmt.Sprintf("Masih ada %d soal yang perlu dipelajari lagi.", wrong))
	} else {
		insights = append(insights, "Jangan menyerah! Coba pelajari materi dan ulangi quiz ini.")
	}

	wrongCount := 0
	for _, a := range answers {
		if !a.IsCorrect && wrongCount < 2 {
			insights = append(insights, fmt.Sprintf("Soal: \"%s\" — jawaban yang benar adalah %s.", a.QuestionText, a.CorrectAnswer))
			wrongCount++
		}
	}

	return insights
}

func GetResult(c *gin.Context) {
	attemptID := c.Param("id")

	var attempt models.Attempt
	err := db.DB.QueryRow(
		`SELECT a.id, a.quiz_id, q.name, a.email, a.name, a.score, a.max_score, a.percentage, a.category, a.created_at
		 FROM attempts a JOIN quizzes q ON a.quiz_id = q.id
		 WHERE a.id = $1`,
		attemptID,
	).Scan(
		&attempt.ID, &attempt.QuizID, &attempt.QuizName,
		&attempt.Email, &attempt.Name,
		&attempt.Score, &attempt.MaxScore, &attempt.Percentage,
		&attempt.Category, &attempt.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		return
	}

	rows, err := db.DB.Query(
		`SELECT ans.question_id, q.text, ans.user_answer, q.correct_answer, ans.is_correct, q.point
		 FROM answers ans JOIN questions q ON ans.question_id = q.id
		 WHERE ans.attempt_id = $1 ORDER BY q.id`,
		attemptID,
	)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var ar models.AnswerResult
			rows.Scan(&ar.QuestionID, &ar.QuestionText, &ar.UserAnswer, &ar.CorrectAnswer, &ar.IsCorrect, &ar.Point)
			if ar.IsCorrect {
				ar.EarnedPoint = ar.Point
			}
			attempt.Answers = append(attempt.Answers, ar)
		}
	}

	attempt.Insights = generateInsights(attempt.Percentage, attempt.Answers)
	c.JSON(http.StatusOK, attempt)
}
