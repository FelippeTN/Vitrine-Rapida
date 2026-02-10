package utils

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadImages handles uploading multiple images from a multipart form.
// It tries to compress each image to JPEG; if that fails, saves the original.
// Returns a list of URL paths for the uploaded images.
func UploadImages(c *gin.Context, fieldName string, maxCount int, maxSize int64) ([]string, error) {
	form, _ := c.MultipartForm()
	var uploaded []string

	if form != nil && form.File[fieldName] != nil {
		files := form.File[fieldName]
		if maxCount > 0 && len(files) > maxCount {
			return nil, fmt.Errorf("máximo de %d imagens permitido", maxCount)
		}
		for i, file := range files {
			url, err := saveOneImage(file, maxSize, i)
			if err != nil {
				return nil, err
			}
			uploaded = append(uploaded, url)
		}
	}

	// Fallback: try single "image" field if nothing uploaded yet
	if len(uploaded) == 0 {
		file, err := c.FormFile("image")
		if err == nil {
			url, err := saveOneImage(file, maxSize, 0)
			if err != nil {
				return nil, err
			}
			uploaded = append(uploaded, url)
		}
	}

	return uploaded, nil
}

// saveOneImage validates size, compresses to JPEG, and saves to disk.
func saveOneImage(file *multipart.FileHeader, maxSize int64, index int) (string, error) {
	if file.Size > maxSize {
		return "", fmt.Errorf("o tamanho da imagem excede o limite de %dMB", maxSize/(1024*1024))
	}

	baseFilename := fmt.Sprintf("%d_%d", time.Now().UnixNano(), index)
	jpgFilename := baseFilename + ".jpg"
	jpgPath := filepath.Join("uploads", jpgFilename)

	if err := SaveCompressedImage(file, jpgPath); err == nil {
		return "/uploads/" + jpgFilename, nil
	}

	// Fallback: save original format
	ext := filepath.Ext(file.Filename)
	filename := baseFilename + ext
	path := filepath.Join("uploads", filename)

	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("could not open image")
	}
	defer src.Close()

	dst, err := os.Create(path)
	if err != nil {
		return "", fmt.Errorf("could not save image")
	}
	defer dst.Close()

	if _, err := dst.ReadFrom(src); err != nil {
		return "", fmt.Errorf("could not save image")
	}

	return "/uploads/" + filename, nil
}

// CreateDirIfNotExists creates a directory and all parents if it doesn't exist.
func CreateDirIfNotExists(dir string) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return os.MkdirAll(dir, 0755)
	}
	return nil
}
