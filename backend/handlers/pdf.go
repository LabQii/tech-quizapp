package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/chromedp/cdproto/emulation"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"github.com/gin-gonic/gin"
)

type PDFRequest struct {
	AttemptID int `json:"attempt_id" binding:"required"`
}

func ExportPDF(c *gin.Context) {
	var req PDFRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	targetURL := fmt.Sprintf("%s/result/%d?pdf=true", frontendURL, req.AttemptID)

	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	ctx, cancel = context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var pdfBuf []byte
	err := chromedp.Run(ctx,
		chromedp.Navigate(targetURL),
		chromedp.WaitVisible(`#result-content`, chromedp.ByID),
		chromedp.Sleep(1*time.Second),
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			pdfBuf, _, err = page.PrintToPDF().
				WithPrintBackground(true).
				Do(ctx)
			return err
		}),
		chromedp.ActionFunc(func(ctx context.Context) error {
			return emulation.SetEmulatedMedia().
				WithMedia("print").
				Do(ctx)
		}),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to generate PDF",
			"detail": err.Error(),
		})
		return
	}

	filename := fmt.Sprintf("quiz-result-%d.pdf", req.AttemptID)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Length", fmt.Sprintf("%d", len(pdfBuf)))
	c.Data(http.StatusOK, "application/pdf", pdfBuf)
}