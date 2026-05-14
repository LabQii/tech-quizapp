package db

import (
	"encoding/json"
	"log"

	"golang.org/x/crypto/bcrypt"
)

type seedQuestion struct {
	Text          string
	Options       map[string]string
	CorrectAnswer string
	Point         int
}

func Seed() {
	seedUsers()
	var count int
	DB.QueryRow(`SELECT COUNT(*) FROM quizzes`).Scan(&count)
	if count > 0 {
		log.Println("Seed already exists, skipping")
		return
	}

	var quizID int
	err := DB.QueryRow(
		`INSERT INTO quizzes (name) VALUES ($1) RETURNING id`,
		"General Knowledge Quiz",
	).Scan(&quizID)
	if err != nil {
		log.Fatal("Failed to seed quiz:", err)
	}

	questions := []seedQuestion{
		{
			Text: "Apa singkatan dari HTTP?",
			Options: map[string]string{
				"A": "HyperText Transfer Protocol",
				"B": "High Transfer Text Protocol",
				"C": "Hyper Transfer Text Process",
				"D": "HyperText Transmission Protocol",
			},
			CorrectAnswer: "A",
			Point:         10,
		},
		{
			Text: "Manakah struktur data yang menggunakan prinsip LIFO?",
			Options: map[string]string{
				"A": "Queue",
				"B": "Stack",
				"C": "Linked List",
				"D": "Tree",
			},
			CorrectAnswer: "B",
			Point:         10,
		},
		{
			Text: "Apa kompleksitas waktu pencarian binary search?",
			Options: map[string]string{
				"A": "O(n)",
				"B": "O(n²)",
				"C": "O(log n)",
				"D": "O(1)",
			},
			CorrectAnswer: "C",
			Point:         20,
		},
		{
			Text: "Manakah yang bukan merupakan HTTP method?",
			Options: map[string]string{
				"A": "GET",
				"B": "POST",
				"C": "FETCH",
				"D": "DELETE",
			},
			CorrectAnswer: "C",
			Point:         10,
		},
		{
			Text: "Dalam SQL, perintah apa yang digunakan untuk mengambil data?",
			Options: map[string]string{
				"A": "INSERT",
				"B": "UPDATE",
				"C": "SELECT",
				"D": "ALTER",
			},
			CorrectAnswer: "C",
			Point:         10,
		},
		{
			Text: "Apa yang dimaksud dengan foreign key dalam database?",
			Options: map[string]string{
				"A": "Kunci utama sebuah tabel",
				"B": "Kolom yang mereferensi primary key tabel lain",
				"C": "Index untuk mempercepat query",
				"D": "Kunci enkripsi data",
			},
			CorrectAnswer: "B",
			Point:         20,
		},
		{
			Text: "Manakah yang merupakan konsep utama OOP?",
			Options: map[string]string{
				"A": "Encapsulation, Inheritance, Polymorphism, Abstraction",
				"B": "Variables, Functions, Loops, Conditions",
				"C": "HTML, CSS, JavaScript, PHP",
				"D": "GET, POST, PUT, DELETE",
			},
			CorrectAnswer: "A",
			Point:         20,
		},
	}

	for _, q := range questions {
		optJSON, _ := json.Marshal(q.Options)
		_, err := DB.Exec(
			`INSERT INTO questions (quiz_id, text, options, correct_answer, point)
			 VALUES ($1, $2, $3, $4, $5)`,
			quizID, q.Text, optJSON, q.CorrectAnswer, q.Point,
		)
		if err != nil {
			log.Fatal("Failed to seed question:", err)
		}
	}

	log.Println("Seed completed: 1 quiz, 7 questions inserted")
}

func seedUsers() {
	var count int
	DB.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&count)
	if count > 0 {
		return
	}

	hashedAdmin, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	hashedUser, _ := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)

	_, err := DB.Exec(
		`INSERT INTO users (username, password, role) VALUES 
		 ($1, $2, 'admin'),
		 ($3, $4, 'user')`,
		"admin", string(hashedAdmin), "user", string(hashedUser),
	)
	if err != nil {
		log.Println("Failed to seed users:", err)
	} else {
		log.Println("Seed users completed: admin and user created")
	}
}