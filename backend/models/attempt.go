package models

import "time"

type Attempt struct {
	ID         int            `json:"id"`
	QuizID     int            `json:"quiz_id"`
	QuizName   string         `json:"quiz_name"`
	Email      string         `json:"email"`
	Name       string         `json:"name"`
	Score      int            `json:"score"`
	MaxScore   int            `json:"max_score"`
	Percentage float64        `json:"percentage"`
	Category   string         `json:"category"`
	Insights   []string       `json:"insights"`
	Answers    []AnswerResult `json:"answers,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
}

type SubmitRequest struct {
	QuizID  int               `json:"quiz_id" binding:"required"`
	Email   string            `json:"email" binding:"required,email"`
	Name    string            `json:"name" binding:"required"`
	Answers map[string]string `json:"answers" binding:"required"`
}