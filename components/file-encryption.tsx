"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import {
    AlertCircle,
    CheckCircle,
    Download,
    Eye,
    Key,
    Lock,
    Shield,
    Unlock,
    XCircle
} from "lucide-react"
import { useState } from "react"

interface FileEncryptionProps {
  fileId: string
  fileName: string
  isEncrypted: boolean
  onStatusChange: () => void
}

export function FileEncryption({ fileId, fileName, isEncrypted, onStatusChange }: FileEncryptionProps) {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [encryptionStatus, setEncryptionStatus] = useState<any>(null)

  const handleEncrypt = async () => {
    if (!password.trim()) {
      setMessage({ type: "error", text: "Please enter a password for encryption" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await apiClient.post(`/files/${fileId}/encrypt`, {
        password: password.trim()
      })

      setMessage({ type: "success", text: "File encrypted successfully!" })
      setPassword("")
      onStatusChange()
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to encrypt file" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecrypt = async () => {
    if (!password.trim()) {
      setMessage({ type: "error", text: "Please enter the decryption password" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await apiClient.post(`/files/${fileId}/decrypt`, {
        password: password.trim()
      })

      setMessage({ type: "success", text: "File decrypted successfully!" })
      setPassword("")
      onStatusChange()
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to decrypt file" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/files/${fileId}/download?password=${encodeURIComponent(password.trim())}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Download failed')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      setMessage({ type: "success", text: "File downloaded successfully!" })
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to download file" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/files/${fileId}/preview?password=${encodeURIComponent(password.trim())}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Preview failed')
      }

      const blob = await response.blob()
      const previewUrl = window.URL.createObjectURL(blob)
      
      // Open in new tab for preview
      window.open(previewUrl, '_blank')
      
      setMessage({ type: "success", text: "File preview opened in new tab!" })
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to preview file" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (isEncrypted) {
      return <Lock className="h-5 w-5 text-green-600" />
    }
    return <Unlock className="h-5 w-5 text-orange-600" />
  }

  const getStatusText = () => {
    if (isEncrypted) {
      return "Encrypted"
    }
    return "Not Encrypted"
  }

  const getStatusColor = () => {
    if (isEncrypted) {
      return "bg-green-100 text-green-800 border-green-200"
    }
    return "bg-orange-100 text-orange-800 border-orange-200"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              File Encryption
            </CardTitle>
            <CardDescription>
              Manage encryption for: <strong>{fileName}</strong>
            </CardDescription>
          </div>
          <Badge className={`flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="encrypt" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="encrypt" disabled={isEncrypted}>
              <Lock className="h-4 w-4 mr-2" />
              Encrypt
            </TabsTrigger>
            <TabsTrigger value="decrypt" disabled={!isEncrypted}>
              <Unlock className="h-4 w-4 mr-2" />
              Decrypt
            </TabsTrigger>
            <TabsTrigger value="access">
              <Eye className="h-4 w-4 mr-2" />
              Access
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encrypt" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="encrypt-password">
                <Key className="h-4 w-4 mr-2 inline" />
                Encryption Password
              </Label>
              <Input
                id="encrypt-password"
                type="password"
                placeholder="Enter password for encryption"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600">
                This password will be used to encrypt your file. Keep it safe - you'll need it to decrypt later.
              </p>
            </div>
            <Button 
              onClick={handleEncrypt} 
              disabled={isLoading || !password.trim()}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Encrypting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Encrypt File
                </div>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="decrypt" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decrypt-password">
                <Key className="h-4 w-4 mr-2 inline" />
                Decryption Password
              </Label>
              <Input
                id="decrypt-password"
                type="password"
                placeholder="Enter decryption password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600">
                Enter the password you used to encrypt this file.
              </p>
            </div>
            <Button 
              onClick={handleDecrypt} 
              disabled={isLoading || !password.trim()}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Decrypting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  Decrypt File
                </div>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-password">
                <Key className="h-4 w-4 mr-2 inline" />
                Access Password
              </Label>
              <Input
                id="access-password"
                type="password"
                placeholder="Enter password to access file"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600">
                Enter the password to download or preview this file.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleDownload} 
                disabled={isLoading || !password.trim()}
                variant="outline"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Downloading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </div>
                )}
              </Button>
              <Button 
                onClick={handlePreview} 
                disabled={isLoading || !password.trim()}
                variant="outline"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </div>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {message && (
          <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Security Information
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Files are encrypted using AES-256-GCM encryption</li>
            <li>• Passwords are never stored on our servers</li>
            <li>• Each file uses a unique salt for enhanced security</li>
            <li>• Keep your passwords safe - we cannot recover them</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 