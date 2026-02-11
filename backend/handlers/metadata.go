package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/FelippeTN/Web-Catalogo/backend/database"
	"github.com/FelippeTN/Web-Catalogo/backend/models"
	"github.com/gin-gonic/gin"
)

func GetCatalogMetadata(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.String(http.StatusBadRequest, "Invalid token")
		return
	}

	var collection models.Collection
	if err := database.DB.Where("share_token = ?", token).First(&collection).Error; err != nil {
		c.String(http.StatusNotFound, "Catalog not found")
		return
	}

	var owner models.User
	storeName := "Vitrine Rápida"
	storeLogo := "https://vitrinerapida.com.br/logo.png" // Default logo

	if err := database.DB.First(&owner, collection.OwnerID).Error; err == nil {
		if owner.Username != "" {
			storeName = owner.Username
		}
		if owner.LogoURL != "" {
			if strings.HasPrefix(owner.LogoURL, "http") {
				storeLogo = owner.LogoURL
			} else {
				// Assuming local uploads are served via /uploads
				// We need the full URL for OG tags
				scheme := "https"
				if c.Request.TLS == nil {
					scheme = "http"
				}
				host := c.Request.Host
				storeLogo = fmt.Sprintf("%s://%s/uploads/%s", scheme, host, owner.LogoURL)
			}
		}
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://vitrinerapida.com.br/catalogs/%s" />
    <meta property="og:title" content="%s" />
    <meta property="og:description" content="Confira os produtos desta vitrine!" />
    <meta property="og:image" content="%s" />
    <meta property="og:image:width" content="300" />
    <meta property="og:image:height" content="300" />
    
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="%s" />
    <meta property="twitter:description" content="Confira os produtos desta vitrine!" />
    <meta property="twitter:image" content="%s" />
</head>
<body>
    <script>window.location.href = "/catalogs/%s";</script>
</body>
</html>`, token, storeName, storeLogo, storeName, storeLogo, token)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, html)
}
