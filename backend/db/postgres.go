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
			id          SERIAL PRIMARY KEY,
			name        TEXT NOT NULL,
			is_archived BOOLEAN DEFAULT FALSE,
			created_at  TIMESTAMP DEFAULT NOW()
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
			quiz_id    INT REFERENCES quizzes(id) ON DELETE CASCADE,
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
			question_id INT REFERENCES questions(id) ON DELETE CASCADE,
			user_answer TEXT NOT NULL,
			is_correct  BOOLEAN NOT NULL DEFAULT FALSE
		)`,
		`CREATE TABLE IF NOT EXISTS users (
			id        SERIAL PRIMARY KEY,
			username  TEXT UNIQUE NOT NULL,
			password  TEXT NOT NULL,
			full_name TEXT NOT NULL DEFAULT '',
			email     TEXT UNIQUE NOT NULL DEFAULT '',
			role      TEXT NOT NULL DEFAULT 'user'
		)`,
	}

	DB.Exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT ''")
	DB.Exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE NOT NULL DEFAULT ''")

	DB.Exec("ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_quiz_id_fkey")
	DB.Exec("ALTER TABLE attempts ADD CONSTRAINT attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE")
	DB.Exec("ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_question_id_fkey")
	DB.Exec("ALTER TABLE answers ADD CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE")

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			log.Fatal("Migration failed:", err)
		}
	}

	DB.Exec("ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE")

	log.Println("Migrations ran successfully")
}