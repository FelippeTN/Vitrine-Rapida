package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type RateLimitEntry struct {
	Count     int
	FirstTime time.Time
}

type RateLimiter struct {
	mu       sync.RWMutex
	entries  map[string]*RateLimitEntry
	limit    int
	window   time.Duration
	cleanupInterval time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		entries:  make(map[string]*RateLimitEntry),
		limit:    limit,
		window:   window,
		cleanupInterval: window,
	}
	
	go rl.cleanup()
	
	return rl
}
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.cleanupInterval)
	defer ticker.Stop()
	
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, entry := range rl.entries {
			if now.Sub(entry.FirstTime) > rl.window {
				delete(rl.entries, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) isAllowed(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	now := time.Now()
	entry, exists := rl.entries[ip]
	
	if !exists {
		rl.entries[ip] = &RateLimitEntry{
			Count:     1,
			FirstTime: now,
		}
		return true
	}
	
	if now.Sub(entry.FirstTime) > rl.window {
		entry.Count = 1
		entry.FirstTime = now
		return true
	}
	
	if entry.Count >= rl.limit {
		return false
	}
	
	entry.Count++
	return true
}

var (
	LoginRateLimiter    = NewRateLimiter(20, 15*time.Minute)  
	RegisterRateLimiter = NewRateLimiter(15, 60*time.Minute)  
)
func RateLimitLoginMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		
		if !LoginRateLimiter.isAllowed(ip) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Muitas tentativas de login. Tente novamente em 15 minutos.",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

func RateLimitRegisterMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		
		if !RegisterRateLimiter.isAllowed(ip) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Muitas tentativas de registro. Tente novamente em 1 hora.",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}
