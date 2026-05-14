package models

import "time"

type Quiz struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Question struct {
	ID            int               `json:"id"`
	QuizID        int               `json:"quiz_id"`
	Text          string            `json:"text"`
	Options       map[string]string `json:"options"`
	CorrectAnswer string            `json:"-"`
	Point         int               `json:"point"`
}