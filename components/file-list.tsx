"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { Download, Eye, Key, Loader2, Lock, Share, Shield, Trash2, Unlock } from "lucide-react"
import { useEffect, useState } from "react"
import { FileEncryption } from "./file-encryption"

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  encrypted: boolean
  shared: boolean
  accessControl?: {
    timeRestriction?: boolean
    locationRestriction?: boolean
    passwordProtected?: boolean
    expirationDate?: string
  }
  downloadCount: number
  lastAccessed?: string
}

interface FileListProps {
  refreshTrigger: number
  onFileDeleted: () => void
  searchQuery?: string
}

interface ShareOptions {
  recipientEmail: string
  permissions: "view" | "download" | "edit"
  expirationDate: string
  passwordProtected: boolean
  password: string
  notifyRecipient: boolean
}

export function FileList({ refreshTrigger, onFileDeleted, searchQuery }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [sharingFile, setSharingFile] = useState<FileItem | null>(null)
  const [encryptionFile, setEncryptionFile] = useState<FileItem | null>(null)
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    recipientEmail: "",
    permissions: "view",
    expirationDate: "",
    passwordProtected: false,
    password: "",
    notifyRecipient: true,
  })
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchFiles()
  }, [refreshTrigger, searchQuery])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""
      const response = await apiClient.get(`/files${params}`)

      // Handle both response formats (direct array or nested in data property)
      const fileData = response.data || response || []
      const filesArray = Array.isArray(fileData) ? fileData : fileData.data || []

      console.log("Files response:", response)
      console.log("Processed files:", filesArray)

      setFiles(filesArray)
    } catch (error) {
      console.error("Failed to fetch files:", error)
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (file: FileItem) => {
    try {
      setDownloadingId(file.id)

      // For encrypted files, we need to prompt for password
      let password = ""
      if (file.encrypted) {
        const promptResult = prompt("Enter decryption password:")
        if (!promptResult) {
          setDownloadingId(null)
          return
        }
        password = promptResult
      }

      // Check if file requires additional password protection
      if (file.accessControl?.passwordProtected) {
        const accessPassword = prompt("Enter file access password:")
        if (!accessPassword) {
          setDownloadingId(null)
          return
        }
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/files/${file.id}/download?password=${encodeURIComponent(password)}`
      
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
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Download successful",
        description: `${file.name} downloaded successfully`,
      })
    } catch (error: any) {
      console.error("Download failed:", error)
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(fileId)
      await apiClient.delete(`/files/${fileId}`)
      setFiles(files.filter((f) => f.id !== fileId))
      onFileDeleted()

      toast({
        title: "File deleted",
        description: "File has been securely deleted",
      })
    } catch (error) {
      console.error("Delete failed:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleShare = async () => {
    if (!sharingFile) return

    try {
      const response = await apiClient.post(`/files/${sharingFile.id}/share`, shareOptions)

      // Copy share link to clipboard
      await navigator.clipboard.writeText(response.data.shareUrl)

      setSharingFile(null)
      setShareOptions({
        recipientEmail: "",
        permissions: "view",
        expirationDate: "",
        passwordProtected: false,
        password: "",
        notifyRecipient: true,
      })

      toast({
        title: "File shared successfully",
        description: "Share link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Failed to create share link",
        variant: "destructive",
      })
    }
  }

  const handlePreview = async (file: FileItem) => {
    // Only allow preview for certain file types
    const previewableTypes = ["image/", "text/", "application/pdf"]
    const canPreview = previewableTypes.some((type) => file.type.startsWith(type))

    if (!canPreview) {
      toast({
        title: "Preview not available",
        description: "This file type does not support preview",
        variant: "destructive",
      })
      return
    }

    try {
      // For encrypted files, we need to prompt for password
      let password = ""
      if (file.encrypted) {
        const promptResult = prompt("Enter decryption password:")
        if (!promptResult) {
          return
        }
        password = promptResult
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/files/${file.id}/preview?password=${encodeURIComponent(password)}`
      
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
      
      toast({
        title: "Preview opened",
        description: "File preview opened in new tab",
      })
    } catch (error: any) {
      console.error("Preview failed:", error)
      toast({
        title: "Preview failed",
        description: error.message || "Failed to preview file",
        variant: "destructive",
      })
    }
  }

  const handleEncryptionStatusChange = () => {
    fetchFiles() // Refresh the file list to update encryption status
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️"
    if (type.startsWith("video/")) return "🎥"
    if (type.startsWith("audio/")) return "🎵"
    if (type === "application/pdf") return "📄"
    if (type.includes("document")) return "📝"
    if (type.includes("spreadsheet")) return "📊"
    if (type.includes("presentation")) return "📽️"
    if (type.includes("zip") || type.includes("rar")) return "📦"
    return "📁"
  }

  const getEncryptionBadge = (encrypted: boolean) => {
    if (encrypted) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <Lock className="h-3 w-3 mr-1" />
          Encrypted
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
        <Unlock className="h-3 w-3 mr-1" />
        Not Encrypted
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading files...</span>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center p-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No files found</h3>
        <p className="text-gray-500 dark:text-gray-400">
          {searchQuery ? "No files match your search criteria." : "Upload your first file to get started."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <Card key={file.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="text-2xl">{getFileIcon(file.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{file.name}</h3>
                    {getEncryptionBadge(file.encrypted)}
                    {file.shared && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Share className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>Uploaded {formatDate(file.uploadedAt)}</span>
                    {file.downloadCount > 0 && (
                      <>
                        <span>•</span>
                        <span>{file.downloadCount} downloads</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(file)}
                  disabled={downloadingId === file.id}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingId === file.id}
                >
                  {downloadingId === file.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEncryptionFile(file)}
                >
                  <Key className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSharingFile(file)}
                >
                  <Share className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(file.id, file.name)}
                  disabled={deletingId === file.id}
                >
                  {deletingId === file.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Encryption Dialog */}
      <Dialog open={!!encryptionFile} onOpenChange={() => setEncryptionFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File Encryption</DialogTitle>
            <DialogDescription>
              Manage encryption for your file
            </DialogDescription>
          </DialogHeader>
          {encryptionFile && (
            <FileEncryption
              fileId={encryptionFile.id}
              fileName={encryptionFile.name}
              isEncrypted={encryptionFile.encrypted}
              onStatusChange={handleEncryptionStatusChange}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={!!sharingFile} onOpenChange={() => setSharingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>
              Create a secure share link for {sharingFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="Enter recipient email"
                value={shareOptions.recipientEmail}
                onChange={(e) => setShareOptions({ ...shareOptions, recipientEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="permissions">Permissions</Label>
              <Select
                value={shareOptions.permissions}
                onValueChange={(value: "view" | "download" | "edit") =>
                  setShareOptions({ ...shareOptions, permissions: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expiration">Expiration Date</Label>
              <Input
                id="expiration"
                type="datetime-local"
                value={shareOptions.expirationDate}
                onChange={(e) => setShareOptions({ ...shareOptions, expirationDate: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="password-protection">Password Protection</Label>
                <p className="text-sm text-gray-500">Require password to access shared file</p>
              </div>
              <Switch
                id="password-protection"
                checked={shareOptions.passwordProtected}
                onCheckedChange={(checked) =>
                  setShareOptions({ ...shareOptions, passwordProtected: checked })
                }
              />
            </div>
            {shareOptions.passwordProtected && (
              <div>
                <Label htmlFor="share-password">Share Password</Label>
                <Input
                  id="share-password"
                  type="password"
                  placeholder="Enter password for shared file"
                  value={shareOptions.password}
                  onChange={(e) => setShareOptions({ ...shareOptions, password: e.target.value })}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify">Notify Recipient</Label>
                <p className="text-sm text-gray-500">Send email notification to recipient</p>
              </div>
              <Switch
                id="notify"
                checked={shareOptions.notifyRecipient}
                onCheckedChange={(checked) =>
                  setShareOptions({ ...shareOptions, notifyRecipient: checked })
                }
              />
            </div>
            <Button onClick={handleShare} className="w-full">
              <Share className="mr-2 h-4 w-4" />
              Create Share Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
