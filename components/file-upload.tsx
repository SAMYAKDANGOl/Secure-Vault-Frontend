"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { File, Key, Lock, Settings, Shield, Upload, X } from "lucide-react"
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
  encryptionPassword: string
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
    encryptionPassword: "",
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

      // Validate encryption password if encryption is enabled
      if (uploadOptions.encryption && !uploadOptions.encryptionPassword.trim()) {
        toast({
          title: "Encryption password required",
          description: "Please enter a password for file encryption",
          variant: "destructive",
        })
        return
      }

      validFiles.forEach((file) => {
        const id = Math.random().toString(36).substr(2, 9)
        const uploadingFile: UploadingFile = {
          file,
          progress: 0,
          id,
        }

        setUploadingFiles((prev) => [...prev, uploadingFile])

        // Prepare upload data with encryption password
        const uploadData = {
          ...uploadOptions,
          encryptionPassword: uploadOptions.encryptionPassword.trim()
        }

        apiClient
          .uploadFile(file, uploadData, (progress) => {
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
                description: `${file.name} uploaded and ${uploadOptions.encryption ? 'encrypted' : 'stored'} successfully`,
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
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Upload Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Drag and drop files here or click to select. Files will be automatically encrypted for security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Maximum file size: 100MB. Supported formats: Images, Videos, Audio, PDFs, Documents, Archives
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                />
              </div>
            </CardContent>
          </Card>

          {uploadingFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploading Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadingFiles.map((uploadingFile) => (
                    <div key={uploadingFile.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <File className="h-8 w-8 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">{uploadingFile.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(uploadingFile.file.size)}
                        </p>
                        <Progress value={uploadingFile.progress} className="mt-2" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(uploadingFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure encryption and access control for your uploaded files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Encryption Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">File Encryption</Label>
                    <p className="text-sm text-gray-500">
                      Encrypt files using AES-256-GCM encryption
                    </p>
                  </div>
                  <Switch
                    checked={uploadOptions.encryption}
                    onCheckedChange={(checked) =>
                      setUploadOptions((prev) => ({ ...prev, encryption: checked }))
                    }
                  />
                </div>

                {uploadOptions.encryption && (
                  <div className="space-y-2">
                    <Label htmlFor="encryption-password" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Encryption Password
                    </Label>
                    <Input
                      id="encryption-password"
                      type="password"
                      placeholder="Enter password for file encryption"
                      value={uploadOptions.encryptionPassword}
                      onChange={(e) =>
                        setUploadOptions((prev) => ({ ...prev, encryptionPassword: e.target.value }))
                      }
                    />
                    <p className="text-sm text-gray-500">
                      This password will be used to encrypt your files. Keep it safe - you'll need it to decrypt later.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant={uploadOptions.encryption ? "default" : "secondary"}>
                    {uploadOptions.encryption ? (
                      <div className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Encrypted
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Not Encrypted
                      </div>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Compression Settings */}
              <div className="space-y-2">
                <Label htmlFor="compression">Compression Level</Label>
                <Select
                  value={uploadOptions.compressionLevel}
                  onValueChange={(value) =>
                    setUploadOptions((prev) => ({ ...prev, compressionLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Compression</SelectItem>
                    <SelectItem value="low">Low Compression</SelectItem>
                    <SelectItem value="medium">Medium Compression</SelectItem>
                    <SelectItem value="high">High Compression</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Access Control Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Access Control</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Time Restrictions</Label>
                    <Switch
                      checked={uploadOptions.accessControl.timeRestriction}
                      onCheckedChange={(checked) => updateAccessControl("timeRestriction", checked)}
                    />
                  </div>
                  {uploadOptions.accessControl.timeRestriction && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="datetime-local"
                          value={uploadOptions.accessControl.startTime}
                          onChange={(e) => updateAccessControl("startTime", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="datetime-local"
                          value={uploadOptions.accessControl.endTime}
                          onChange={(e) => updateAccessControl("endTime", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Password Protection</Label>
                    <Switch
                      checked={uploadOptions.accessControl.passwordProtection}
                      onCheckedChange={(checked) => updateAccessControl("passwordProtection", checked)}
                    />
                  </div>
                  {uploadOptions.accessControl.passwordProtection && (
                    <div>
                      <Label>Share Password</Label>
                      <Input
                        type="password"
                        placeholder="Enter password for file sharing"
                        value={uploadOptions.accessControl.password}
                        onChange={(e) => updateAccessControl("password", e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <Input
                    type="datetime-local"
                    value={uploadOptions.accessControl.expirationDate}
                    onChange={(e) => updateAccessControl("expirationDate", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
