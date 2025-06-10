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
import { Clock, Download, Eye, Loader2, Lock, MapPin, Share, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

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

      // Check if file requires password
      if (file.accessControl?.passwordProtected) {
        const password = prompt("Enter file password:")
        if (!password) {
          setDownloadingId(null)
          return
        }
      }

      const blob = await apiClient.downloadFile(file.id)

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

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
        description: "This file type cannot be previewed",
        variant: "destructive",
      })
      return
    }

    setPreviewFile(file)
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
    if (type.includes("pdf")) return "📄"
    if (type.includes("word") || type.includes("document")) return "📝"
    if (type.includes("spreadsheet") || type.includes("excel")) return "📊"
    if (type.includes("zip") || type.includes("rar")) return "📦"
    return "📄"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {searchQuery ? "No files found matching your search" : "No files uploaded yet"}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {files.map((file) => (
          <Card key={file.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-2xl">{getFileIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                      {file.encrypted && (
                        <span title="Encrypted">
                          <Lock className="h-3 w-3 text-green-600" />
                        </span>
                      )}
                      {file.shared && (
                        <span title="Shared">
                          <Share className="h-3 w-3 text-blue-600" />
                        </span>
                      )}
                      {file.accessControl?.timeRestriction && (
                        <span title="Time Restricted">
                          <Clock className="h-3 w-3 text-orange-600" />
                        </span>
                      )}
                      {file.accessControl?.locationRestriction && (
                        <span title="Location Restricted">
                          <MapPin className="h-3 w-3 text-purple-600" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(file.size)}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(file.uploadedAt)}</span>
                      <span className="text-xs text-gray-500">{file.downloadCount} downloads</span>
                      {file.lastAccessed && (
                        <span className="text-xs text-gray-500">Last accessed: {formatDate(file.lastAccessed)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handlePreview(file)} title="Preview file">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === file.id}
                    title="Download file"
                  >
                    {downloadingId === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSharingFile(file)} title="Share file">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(file.id, file.name)}
                    disabled={deletingId === file.id}
                    title="Delete file"
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
      </div>

      {/* Share Dialog */}
      <Dialog open={!!sharingFile} onOpenChange={() => setSharingFile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>Create a secure share link for "{sharingFile?.name}"</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email (Optional)</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="recipient@example.com"
                value={shareOptions.recipientEmail}
                onChange={(e) => setShareOptions((prev) => ({ ...prev, recipientEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <Select
                value={shareOptions.permissions}
                onValueChange={(value: any) => setShareOptions((prev) => ({ ...prev, permissions: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permissions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="download">View & Download</SelectItem>
                  <SelectItem value="edit">Full Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date (Optional)</Label>
              <Input
                id="expirationDate"
                type="datetime-local"
                value={shareOptions.expirationDate}
                onChange={(e) => setShareOptions((prev) => ({ ...prev, expirationDate: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password Protection</Label>
                <p className="text-sm text-gray-500">Require password to access</p>
              </div>
              <Switch
                checked={shareOptions.passwordProtected}
                onCheckedChange={(checked) => setShareOptions((prev) => ({ ...prev, passwordProtected: checked }))}
              />
            </div>

            {shareOptions.passwordProtected && (
              <div className="space-y-2">
                <Label htmlFor="sharePassword">Share Password</Label>
                <Input
                  id="sharePassword"
                  type="password"
                  placeholder="Enter share password"
                  value={shareOptions.password}
                  onChange={(e) => setShareOptions((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notify Recipient</Label>
                <p className="text-sm text-gray-500">Send email notification</p>
              </div>
              <Switch
                checked={shareOptions.notifyRecipient}
                onCheckedChange={(checked) => setShareOptions((prev) => ({ ...prev, notifyRecipient: checked }))}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSharingFile(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleShare} className="flex-1">
                Create Share Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
            <DialogDescription>Preview of "{previewFile?.name}"</DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-auto">
            {previewFile?.type.startsWith("image/") && (
              <img src={`/api/files/${previewFile.id}/preview`} alt={previewFile.name} className="max-w-full h-auto" />
            )}
            {previewFile?.type === "application/pdf" && (
              <iframe src={`/api/files/${previewFile.id}/preview`} className="w-full h-96" title={previewFile.name} />
            )}
            {previewFile?.type.startsWith("text/") && (
              <pre className="whitespace-pre-wrap text-sm">Loading preview...</pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
