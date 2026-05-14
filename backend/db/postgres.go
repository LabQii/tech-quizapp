package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Database unreachable:", err)
	}

	log.Println("Database connected successfully")
}

func Migrate() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS quizzes (
			id         SERIAL PRIMARY KEY,
			name       TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS questions (
			id             SERIAL PRIMARY KEY,
			quiz_id        INT REFERENCES quizzes(id) ON DELETE CASCADE,
			text           TEXT NOT NULL,
			options        JSONB NOT NULL,
			correct_answer TEXT NOT NULL,
			point          INT NOT NULL DEFAULT 10
		)`,
		`CREATE TABLE IF NOT EXISTS attempts (
			id         SERIAL PRIMARY KEY,
			quiz_id    INT REFERENCES quizzes(id),
			email      TEXT NOT NULL,
			name       TEXT NOT NULL,
			score      INT NOT NULL DEFAULT 0,
			max_score  INT NOT NULL DEFAULT 0,
			percentage FLOAT NOT NULL DEFAULT 0,
			category   TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS answers (
			id          SERIAL PRIMARY KEY,
			attempt_id  INT REFERENCES attempts(id) ON DELETE CASCADE,
			question_id INT REFERENCES questions(id),
			user_answer TEXT NOT NULL,
			is_correct  BOOLEAN NOT NULL DEFAULT FALSE
		)`,
		`CREATE TABLE IF NOT EXISTS users (
			id       SERIAL PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			role     TEXT NOT NULL DEFAULT 'user'
		)`,
	}

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			log.Fatal("Migration failed:", err)
		}
	}

	log.Println("Migrations ran successfully")
}