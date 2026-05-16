package handlers

import (
	"log"
	"net/http"
	"os"
	"quizapp/db"
	"quizapp/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := db.DB.QueryRow(
		"SELECT id, username, password, full_name, email, role FROM users WHERE email = $1 OR username = $1",
		req.Identifier,
	).Scan(&user.ID, &user.Username, &user.Password, &user.FullName, &user.Email, &user.Role)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email/Username atau password salah"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email/Username atau password salah"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "secret_key_anda"
	}

	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.LoginResponse{
		Token: tokenString,
		Role:  user.Role,
	})
}

func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	_, err := db.DB.Exec(
		"INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, 'user')",
		req.Username, string(hashedPassword), req.FullName, req.Email,
	)

	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			if strings.Contains(err.Error(), "email") {
				c.JSON(http.StatusConflict, gin.H{"error": "Email sudah terdaftar"})
			} else {
				c.JSON(http.StatusConflict, gin.H{"error": "Username sudah terdaftar"})
			}
		} else {
			log.Println("Registration error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data ke database"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

func Me(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	err := db.DB.QueryRow("SELECT id, username, full_name, email, role FROM users WHERE id = $1", userID).Scan(&user.ID, &user.Username, &user.FullName, &user.Email, &user.Role)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}
