package utils

import (
	"fmt"
	"net/smtp"
	"os"
)

func SendEmail(to []string, subject string, body string) error {
	from := os.Getenv("SMTP_FROM")
	password := os.Getenv("SMTP_PASSWORD")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")

	// Fallback for missing env vars to avoid crashing, just log
	if smtpHost == "" || smtpPort == "" || smtpUser == "" || password == "" {
		fmt.Printf("MOCK EMAIL SENT:\nTo: %v\nSubject: %s\nBody: %s\n", to, subject, body)
		return nil
	}

	auth := smtp.PlainAuth("", smtpUser, password, smtpHost)

	headers := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\r\n"
	msg := "From: " + from + "\r\n" +
		"To: " + to[0] + "\r\n" +
		"Subject: " + subject + "\r\n" +
		headers + "\r\n" +
		body

	// Use smtpUser as the envelope sender (MAIL FROM), as it must be a bare email address.
	// The 'from' variable (SMTP_FROM) is used in the message header for display.
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, smtpUser, to, []byte(msg))
	if err != nil {
		return err
	}
	return nil
}
