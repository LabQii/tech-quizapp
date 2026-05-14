package models

type AnswerResult struct {
	QuestionID    int    `json:"question_id"`
	QuestionText  string `json:"question_text"`
	UserAnswer    string `json:"user_answer"`
	CorrectAnswer string `json:"correct_answer"`
	IsCorrect     bool   `json:"is_correct"`
	Point         int    `json:"point"`
	EarnedPoint   int    `json:"earned_point"`
}