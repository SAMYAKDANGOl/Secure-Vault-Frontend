"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { File, Shield, Upload, X } from "lucide-react"
import { useCallback, useRef, useState } from "react"

interface FileUploadProps {
  onUploadComplete: () => void
}

interface UploadingFile {
  file: File
  progress: number
  id: string
}

interface UploadOptions {
  encryption: boolean
  compressionLevel: string
  accessControl: {
    timeRestriction: boolean
    startTime: string
    endTime: string
    locationRestriction: boolean
    allowedCountries: string[]
    passwordProtection: boolean
    password: string
    expirationDate: string
  }
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
    encryption: true,
    compressionLevel: "medium",
    accessControl: {
      timeRestriction: false,
      startTime: "",
      endTime: "",
      locationRestriction: false,
      allowedCountries: [],
      passwordProtection: false,
      password: "",
      expirationDate: "",
    },
  })
  const { toast } = useToast()

  const handleFiles = useCallback(
    (files: FileList) => {
      // Validate file types and sizes
      const maxSize = 100 * 1024 * 1024 // 100MB
      const allowedTypes = [
        "image/",
        "video/",
        "audio/",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument",
        "text/",
        "application/zip",
        "application/x-rar",
      ]

      const validFiles = Array.from(files).filter((file) => {
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 100MB limit`,
            variant: "destructive",
          })
          return false
        }

        const isValidType = allowedTypes.some((type) => file.type.startsWith(type))
        if (!isValidType) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported file type`,
            variant: "destructive",
          })
          return false
        }

        return true
      })

      validFiles.forEach((file) => {
        const id = Math.random().toString(36).substr(2, 9)
        const uploadingFile: UploadingFile = {
          file,
          progress: 0,
          id,
        }

        setUploadingFiles((prev) => [...prev, uploadingFile])

        apiClient
          .uploadFile(file, uploadOptions, (progress) => {
            setUploadingFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)))
          })
          .then((response) => {
            console.log("Upload response:", response)

            // Narrow the type of response
            const res = response as { success?: boolean; file?: any; data?: { success?: boolean; file?: any } }

            // Handle different response formats
            const success = res.success || (res.data && res.data.success)
            const fileData = res.file || (res.data && res.data.file)

            if (success || fileData) {
              setUploadingFiles((prev) => prev.filter((f) => f.id !== id))
              onUploadComplete()
              toast({
                title: "Upload successful",
                description: `${file.name} uploaded and encrypted successfully`,
              })
            } else {
              throw new Error("Invalid response format from server")
            }
          })
          .catch((error) => {
            console.error("Upload failed:", error)
            setUploadingFiles((prev) => prev.filter((f) => f.id !== id))

            // Provide more detailed error information
            const errorMessage = error.message || "Unknown error"
            const statusCode = error.statusCode || ""

            toast({
              title: `Upload failed ${statusCode ? `(${statusCode})` : ""}`,
              description: `Failed to upload ${file.name}: ${errorMessage}`,
              variant: "destructive",
            })
          })
      })
    },
    [onUploadComplete, toast, uploadOptions],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const updateAccessControl = (field: string, value: any) => {
    setUploadOptions((prev) => ({
      ...prev,
      accessControl: {
        ...prev.accessControl,
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Security Options</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>File Encryption</Label>
              <p className="text-sm text-gray-500">Encrypt files with AES-256</p>
            </div>
            <Switch
              checked={uploadOptions.encryption}
              onCheckedChange={(checked) => setUploadOptions((prev) => ({ ...prev, encryption: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Compression Level</Label>
            <Select
              value={uploadOptions.compressionLevel}
              onValueChange={(value) => setUploadOptions((prev) => ({ ...prev, compressionLevel: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select compression" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Compression</SelectItem>
                <SelectItem value="low">Low (Fast)</SelectItem>
                <SelectItem value="medium">Medium (Balanced)</SelectItem>
                <SelectItem value="high">High (Small Size)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Access Control</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Time Restriction</Label>
              <p className="text-sm text-gray-500">Limit access to specific hours</p>
            </div>
            <Switch
              checked={uploadOptions.accessControl.timeRestriction}
              onCheckedChange={(checked) => updateAccessControl("timeRestriction", checked)}
            />
          </div>

          {uploadOptions.accessControl.timeRestriction && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Start Time</Label>
                <Input
                  type="time"
                  value={uploadOptions.accessControl.startTime}
                  onChange={(e) => updateAccessControl("startTime", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Time</Label>
                <Input
                  type="time"
                  value={uploadOptions.accessControl.endTime}
                  onChange={(e) => updateAccessControl("endTime", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Password Protection</Label>
              <p className="text-sm text-gray-500">Require password to access</p>
            </div>
            <Switch
              checked={uploadOptions.accessControl.passwordProtection}
              onCheckedChange={(checked) => updateAccessControl("passwordProtection", checked)}
            />
          </div>

          {uploadOptions.accessControl.passwordProtection && (
            <div className="space-y-2">
              <Label>Access Password</Label>
              <Input
                type="password"
                placeholder="Enter access password"
                value={uploadOptions.accessControl.password}
                onChange={(e) => updateAccessControl("password", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Input
              type="datetime-local"
              value={uploadOptions.accessControl.expirationDate}
              onChange={(e) => updateAccessControl("expirationDate", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-300 mb-2">Drag and drop files here, or click to select files</p>
            <p className="text-sm text-gray-500 mb-4">
              Maximum file size: 100MB. Supported formats: Images, Documents, Videos, Audio, Archives
            </p>
            <Button variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Choose Files Securely
            </Button>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploading Files</h4>
          {uploadingFiles.map((uploadingFile) => (
            <div key={uploadingFile.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium truncate">{uploadingFile.file.name}</span>
                  <span className="text-xs text-gray-500">{formatFileSize(uploadingFile.file.size)}</span>
                  {uploadOptions.encryption && <Shield className="h-3 w-3 text-green-600" />}
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeUploadingFile(uploadingFile.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Progress value={uploadingFile.progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{Math.round(uploadingFile.progress)}% complete</span>
                <span>{uploadingFile.progress < 100 ? "Encrypting and uploading..." : "Processing..."}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
