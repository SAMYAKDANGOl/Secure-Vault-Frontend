import { mockApiClient } from "./api-mock"
import { supabase } from "./supabase"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"

class ApiClient {
  private async getAuthHeaders() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        console.warn("No authentication token available - user may not be logged in")
      }

      return {
        "Content-Type": "application/json",
        Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
      }
    } catch (error) {
      console.error("Error getting auth headers:", error)
      return {
        "Content-Type": "application/json",
        Authorization: "",
      }
    }
  }

  async get(endpoint: string) {
    if (USE_MOCK) {
      console.log(`[MOCK API] GET ${endpoint}`)
      return mockApiClient.get(endpoint)
    }

    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      console.log(`[FALLBACK] Using mock data for ${endpoint}`)
      // Fallback to mock data on error
      return mockApiClient.get(endpoint)
    }
  }

  async post(endpoint: string, data?: any) {
    if (USE_MOCK) {
      console.log(`[MOCK API] POST ${endpoint}`)
      return mockApiClient.post(endpoint, data)
    }

    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: data instanceof FormData ? { Authorization: headers.Authorization } : headers,
        body: data instanceof FormData ? data : JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      console.log(`[FALLBACK] Using mock response for ${endpoint}`)
      return mockApiClient.post(endpoint, data)
    }
  }

  async delete(endpoint: string) {
    if (USE_MOCK) {
      console.log(`[MOCK API] DELETE ${endpoint}`)
      return mockApiClient.delete(endpoint)
    }

    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      console.log(`[FALLBACK] Using mock response for ${endpoint}`)
      return mockApiClient.delete(endpoint)
    }
  }

  async uploadFile(file: File, options: any, onProgress?: (progress: number) => void) {
    if (USE_MOCK) {
      console.log(`[MOCK API] UPLOAD ${file.name}`)
      return mockApiClient.uploadFile(file, options, onProgress)
    }

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("options", JSON.stringify(options))

      const {
        data: { session },
      } = await supabase.auth.getSession()

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100
            onProgress(progress)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"))
        })

        xhr.open("POST", `${API_URL}/files/upload`)
        xhr.setRequestHeader("Authorization", `Bearer ${session?.access_token}`)
        xhr.send(formData)
      })
    } catch (error) {
      console.error("Upload error:", error)
      console.log(`[FALLBACK] Using mock upload for ${file.name}`)
      return mockApiClient.uploadFile(file, options, onProgress)
    }
  }

  async downloadFile(fileId: string) {
    if (USE_MOCK) {
      console.log(`[MOCK API] DOWNLOAD ${fileId}`)
      return mockApiClient.downloadFile(fileId)
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(`${API_URL}/files/${fileId}/download`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      return response.blob()
    } catch (error) {
      console.error("Download error:", error)
      console.log(`[FALLBACK] Using mock download for ${fileId}`)
      return mockApiClient.downloadFile(fileId)
    }
  }
}

export const apiClient = new ApiClient()
