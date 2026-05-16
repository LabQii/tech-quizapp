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

	if percentage == 100 {
		insights = append(insights, "Luar biasa! Anda berhasil menjawab seluruh pertanyaan dengan sempurna. Pemahaman materi Anda sangat matang.")
	} else if percentage >= 80 {
		insights = append(insights, fmt.Sprintf("Hasil yang sangat impresif. Anda menguasai sebagian besar materi dengan akurasi %d%%.", int(percentage)))
	} else if percentage >= 60 {
		insights = append(insights, "Performa yang cukup baik. Anda memiliki pemahaman dasar yang kuat, namun masih ada ruang untuk penguatan di beberapa topik.")
	} else {
		insights = append(insights, "Jangan patah semangat. Quiz ini menunjukkan ada beberapa konsep fundamental yang perlu ditinjau kembali agar pemahaman Anda lebih solid.")
	}

	wrongCount := 0
	var topicsToReview []string
	for _, a := range answers {
		if !a.IsCorrect && wrongCount < 2 {
			topicsToReview = append(topicsToReview, a.QuestionText)
			wrongCount++
		}
	}

	if len(topicsToReview) > 0 {
		if percentage >= 80 {
			insights = append(insights, fmt.Sprintf("Untuk mencapai kesempurnaan, Anda bisa meninjau kembali detail pada topik: %s.", topicsToReview[0]))
		} else {
			insights = append(insights, "Fokuskan pembelajaran Anda pada area yang masih keliru, terutama mengenai konsep yang ditanyakan pada poin rincian jawaban di bawah.")
		}
	}

	if percentage < 60 {
		insights = append(insights, "Kami menyarankan Anda untuk membaca kembali materi modul terkait sebelum mencoba simulasi quiz ini kembali.")
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
