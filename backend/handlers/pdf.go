package handlers

import (
	"bytes"
	"fmt"
	"math"
	"net/http"
	"quizapp/db"
	"quizapp/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-pdf/fpdf"
)

type PDFRequest struct {
	AttemptID int `json:"attempt_id" binding:"required"`
}

func hexToRGB(hex string) (r, g, b int) {
	fmt.Sscanf(hex, "#%02x%02x%02x", &r, &g, &b)
	return
}

func categoryLabel(c string) string {
	switch c {
	case "Advanced":
		return "Advanced"
	case "Intermediate":
		return "Intermediate"
	default:
		return "Beginner"
	}
}

func ExportPDF(c *gin.Context) {
	var req PDFRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var attempt models.Attempt
	err := db.DB.QueryRow(
		`SELECT a.id, a.quiz_id, q.name, a.email, a.name, a.score, a.max_score, a.percentage, a.category, a.created_at
		 FROM attempts a JOIN quizzes q ON a.quiz_id = q.id
		 WHERE a.id = $1`,
		req.AttemptID,
	).Scan(
		&attempt.ID, &attempt.QuizID, &attempt.QuizName,
		&attempt.Email, &attempt.Name,
		&attempt.Score, &attempt.MaxScore, &attempt.Percentage,
		&attempt.Category, &attempt.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data attempt tidak ditemukan"})
		return
	}

	rows, err := db.DB.Query(
		`SELECT ans.question_id, q.text, ans.user_answer, q.correct_answer, ans.is_correct, q.point
		 FROM answers ans JOIN questions q ON ans.question_id = q.id
		 WHERE ans.attempt_id = $1 ORDER BY q.id`,
		req.AttemptID,
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

	correct := 0
	for _, a := range attempt.Answers {
		if a.IsCorrect {
			correct++
		}
	}
	wrong := len(attempt.Answers) - correct

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(20, 20, 20)
	pdf.AddPage()

	pageW := 170.0

	r, g, b := hexToRGB("#059669")
	pdf.SetFillColor(r, g, b)
	pdf.Rect(0, 0, 210, 32, "F")

	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 20)
	pdf.SetXY(20, 10)
	pdf.Cell(0, 10, "Hasil Technical Test")

	pdf.SetFont("Helvetica", "", 10)
	pdf.SetXY(20, 20)
	pdf.Cell(0, 6, "Laporan Evaluasi Kompetensi")

	pdf.SetFont("Helvetica", "", 9)
	dateStr := attempt.CreatedAt.UTC().Format("02 January 2006, 15:04") + " WIB"
	pdf.SetXY(20, 20)
	pdf.CellFormat(pageW, 6, dateStr, "", 0, "R", false, 0, "")
	pdf.Ln(22)

	pdf.SetTextColor(30, 41, 59)
	pdf.SetFont("Helvetica", "B", 12)
	pdf.Cell(0, 8, "Informasi Peserta")
	pdf.Ln(10)

	pdf.SetFont("Helvetica", "", 10)
	infoRows := [][]string{
		{"Nama Lengkap", attempt.Name},
		{"Alamat Email", attempt.Email},
		{"Judul Quiz", attempt.QuizName},
		{"Waktu Selesai", dateStr},
	}
	for _, row := range infoRows {
		pdf.SetFont("Helvetica", "B", 10)
		pdf.SetTextColor(100, 116, 139)
		pdf.Cell(40, 7, row[0])
		pdf.SetTextColor(30, 41, 59)
		pdf.Cell(5, 7, ":")
		pdf.SetFont("Helvetica", "", 10)
		pdf.Cell(0, 7, row[1])
		pdf.Ln(7)
	}
	pdf.Ln(6)

	pdf.SetDrawColor(226, 232, 240)
	pdf.Line(20, pdf.GetY(), 190, pdf.GetY())
	pdf.Ln(8)

	pdf.SetFont("Helvetica", "B", 12)
	pdf.SetTextColor(30, 41, 59)
	pdf.Cell(0, 8, "Ringkasan Hasil")
	pdf.Ln(10)

	boxW := 52.0
	boxH := 30.0
	boxY := pdf.GetY()
	boxX := 20.0
	gap := 7.0

	boxes := []struct {
		label string
		value string
		hex   string
	}{
		{"Skor Akhir", fmt.Sprintf("%d / %d", attempt.Score, attempt.MaxScore), "#059669"},
		{"Persentase", fmt.Sprintf("%.0f%%", attempt.Percentage), "#0d9488"},
		{"Kategori", categoryLabel(attempt.Category), "#0891b2"},
	}

	for _, box := range boxes {
		br, bg, bb := hexToRGB(box.hex)
		pdf.SetDrawColor(br, bg, bb)
		pdf.SetFillColor(240, 253, 244)
		pdf.SetLineWidth(0.4)
		pdf.Rect(boxX, boxY, boxW, boxH, "DF")
		pdf.SetLineWidth(0.2)

		pdf.SetFont("Helvetica", "B", 8)
		pdf.SetTextColor(100, 116, 139)
		pdf.SetXY(boxX, boxY+6)
		pdf.CellFormat(boxW, 5, box.label, "", 0, "C", false, 0, "")

		pdf.SetFont("Helvetica", "B", 16)
		pdf.SetTextColor(br, bg, bb)
		pdf.SetXY(boxX, boxY+14)
		pdf.CellFormat(boxW, 8, box.value, "", 0, "C", false, 0, "")

		boxX += boxW + gap
	}
	pdf.SetY(boxY + boxH + 10)

	pdf.SetFont("Helvetica", "B", 12)
	pdf.SetTextColor(30, 41, 59)
	pdf.Cell(0, 8, "Visualisasi Performa")
	pdf.Ln(10)

	chartY := pdf.GetY()
	chartX := 20.0
	maxBarW := 105.0
	barH := 9.0
	barGap := 6.0

	chartData := []struct {
		label string
		value float64
		max   float64
		hex   string
	}{
		{"Jawaban Benar", float64(correct), float64(len(attempt.Answers)), "#10b981"},
		{"Jawaban Salah", float64(wrong), float64(len(attempt.Answers)), "#ef4444"},
		{"Efisiensi Skor", float64(attempt.Score), float64(attempt.MaxScore), "#059669"},
	}

	for _, cd := range chartData {
		ratio := 0.0
		if cd.max > 0 {
			ratio = cd.value / cd.max
		}
		fillW := maxBarW * ratio

		pdf.SetFont("Helvetica", "", 10)
		pdf.SetTextColor(71, 85, 105)
		pdf.SetXY(chartX, chartY)
		pdf.CellFormat(45, barH, cd.label, "", 0, "L", false, 0, "")

		pdf.SetFillColor(241, 245, 249)
		pdf.Rect(chartX+45, chartY+1, maxBarW, barH-2, "F")

		if fillW > 0 {
			fr, fg, fb := hexToRGB(cd.hex)
			pdf.SetFillColor(fr, fg, fb)
			pdf.Rect(chartX+45, chartY+1, fillW, barH-2, "F")
		}

		pct := math.Round(ratio * 100)
		pdf.SetFont("Helvetica", "B", 9)
		pdf.SetTextColor(30, 41, 59)
		pdf.SetXY(chartX+45+maxBarW+4, chartY)
		pdf.CellFormat(20, barH, fmt.Sprintf("%.0f%%", pct), "", 0, "L", false, 0, "")

		chartY += barH + barGap
	}
	pdf.Ln(12)

	pdf.SetFont("Helvetica", "B", 12)
	pdf.SetTextColor(30, 41, 59)
	pdf.Cell(0, 8, "Rincian Jawaban")
	pdf.Ln(10)

	colWidths := []float64{10, 85, 25, 25, 25}
	headers := []string{"No", "Pertanyaan", "Jawaban Anda", "Kunci Jawaban", "Status"}

	pdf.SetFillColor(5, 150, 105)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 9)
	for i, h := range headers {
		pdf.CellFormat(colWidths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	pdf.SetFont("Helvetica", "", 9)
	for i, ans := range attempt.Answers {
		if i%2 == 0 {
			pdf.SetFillColor(248, 250, 252)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}

		status := "Salah"
		if ans.IsCorrect {
			status = "Benar"
			pdf.SetTextColor(5, 150, 105)
		} else {
			pdf.SetTextColor(220, 38, 38)
		}

		qText := ans.QuestionText
		if len(qText) > 60 {
			qText = qText[:57] + "..."
		}

		pdf.CellFormat(colWidths[0], 8, fmt.Sprintf("%d", i+1), "1", 0, "C", true, 0, "")
		pdf.SetTextColor(30, 41, 59)
		pdf.CellFormat(colWidths[1], 8, qText, "1", 0, "L", true, 0, "")
		pdf.CellFormat(colWidths[2], 8, ans.UserAnswer, "1", 0, "C", true, 0, "")
		pdf.SetTextColor(5, 150, 105)
		pdf.CellFormat(colWidths[3], 8, ans.CorrectAnswer, "1", 0, "C", true, 0, "")
		
		if ans.IsCorrect {
			pdf.SetTextColor(5, 150, 105)
		} else {
			pdf.SetTextColor(220, 38, 38)
		}
		pdf.CellFormat(colWidths[4], 8, status, "1", 0, "C", true, 0, "")
		pdf.Ln(-1)

		if pdf.GetY() > 260 {
			pdf.AddPage()
		}
	}
	pdf.Ln(10)

	if len(attempt.Insights) > 0 {
		pdf.SetFont("Helvetica", "B", 12)
		pdf.SetTextColor(30, 41, 59)
		pdf.Cell(0, 8, "Analisis Performa")
		pdf.Ln(10)

		pdf.SetFillColor(240, 253, 244)
		pdf.SetDrawColor(167, 243, 208)
		for _, insight := range attempt.Insights {
			pdf.SetFont("Helvetica", "", 10)
			pdf.SetTextColor(51, 65, 85)
			pdf.SetX(20)
			pdf.MultiCell(pageW, 8, "- "+insight, "1", "L", true)
			pdf.Ln(2)
		}
	}

	pdf.Ln(10)
	pdf.SetFont("Helvetica", "I", 8)
	pdf.SetTextColor(148, 163, 184)
	pdf.CellFormat(pageW, 5, fmt.Sprintf("Technical Test Evaluation - Generated on %s", time.Now().Local().Format("02/01/2006 15:04")), "", 0, "C", false, 0, "")

	var buf bytes.Buffer
	err = pdf.Output(&buf)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan PDF"})
		return
	}

	filename := fmt.Sprintf("Technical-Test-Hasil-%s.pdf", attempt.Name)
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Header("Content-Length", fmt.Sprintf("%d", buf.Len()))
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}