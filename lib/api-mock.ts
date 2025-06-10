// Mock API client for development without backend
class MockApiClient {
  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async get(endpoint: string) {
    await this.delay(500) // Simulate network delay

    // Mock responses for different endpoints
    if (endpoint === "/stats") {
      return {
        data: {
          totalFiles: 12,
          totalSize: 45678901,
          lastUpload: "2024-01-15",
          activeShares: 3,
          securityScore: 85,
        },
      }
    }

    if (endpoint.startsWith("/files")) {
      return {
        data: [
          {
            id: "1",
            name: "document.pdf",
            size: 1024000,
            type: "application/pdf",
            uploadedAt: "2024-01-15T10:30:00Z",
            encrypted: true,
            shared: false,
            downloadCount: 5,
            lastAccessed: "2024-01-14T15:20:00Z",
          },
          {
            id: "2",
            name: "image.jpg",
            size: 2048000,
            type: "image/jpeg",
            uploadedAt: "2024-01-14T09:15:00Z",
            encrypted: true,
            shared: true,
            downloadCount: 2,
            lastAccessed: "2024-01-13T11:45:00Z",
          },
          {
            id: "3",
            name: "presentation.pptx",
            size: 5120000,
            type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            uploadedAt: "2024-01-13T14:22:00Z",
            encrypted: true,
            shared: false,
            downloadCount: 1,
            lastAccessed: "2024-01-13T16:30:00Z",
          },
        ],
      }
    }

    if (endpoint.startsWith("/access-control/rules")) {
      return {
        data: [
          {
            id: "1",
            type: "time",
            name: "Business Hours Only",
            enabled: true,
            config: {
              startTime: "09:00",
              endTime: "17:00",
            },
          },
          {
            id: "2",
            type: "location",
            name: "US Access Only",
            enabled: false,
            config: {
              countries: ["US", "CA"],
            },
          },
        ],
      }
    }

    if (endpoint.startsWith("/audit/logs")) {
      return {
        data: [
          {
            id: "1",
            action: "file_upload",
            resource: "/files/1",
            timestamp: "2024-01-15T10:30:00Z",
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            success: true,
            details: { filename: "document.pdf", size: 1024000 },
          },
          {
            id: "2",
            action: "file_download",
            resource: "/files/2",
            timestamp: "2024-01-15T09:15:00Z",
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            success: true,
            details: { filename: "image.jpg" },
          },
          {
            id: "3",
            action: "login",
            resource: "/auth/login",
            timestamp: "2024-01-15T08:45:00Z",
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            success: true,
          },
        ],
      }
    }

    if (endpoint.startsWith("/user/settings")) {
      return {
        data: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          emailNotifications: true,
          securityAlerts: true,
          dataRetention: 365,
        },
      }
    }

    if (endpoint.startsWith("/user/devices")) {
      return {
        data: [
          {
            id: "1",
            name: "Windows PC",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            location: "New York, US",
            lastSeen: "2024-01-15T10:30:00Z",
          },
          {
            id: "2",
            name: "iPhone",
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
            location: "New York, US",
            lastSeen: "2024-01-14T18:20:00Z",
          },
        ],
      }
    }

    return { data: [] }
  }

  async post(endpoint: string, data?: any) {
    await this.delay(500)

    if (endpoint.includes("/auth/check-2fa")) {
      return { requiresTwoFactor: false }
    }

    if (endpoint.includes("/share")) {
      return {
        success: true,
        shareUrl: "https://secure-vault.com/shared/abc123",
        shareToken: "abc123",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }

    return { success: true, message: "Mock operation completed" }
  }

  async delete(endpoint: string) {
    await this.delay(500)
    return { success: true, message: "Mock delete completed" }
  }

  async uploadFile(file: File, options: any, onProgress?: (progress: number) => void) {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await this.delay(100)
      if (onProgress) onProgress(i)
    }

    return {
      success: true,
      file: {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
      },
    }
  }

  async downloadFile(fileId: string) {
    await this.delay(500)
    // Return a mock blob
    return new Blob(["Mock file content for file " + fileId], { type: "text/plain" })
  }
}

export const mockApiClient = new MockApiClient()
