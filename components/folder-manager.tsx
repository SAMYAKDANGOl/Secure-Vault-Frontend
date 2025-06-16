'use client'

import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/use-toast'
import {
  ChevronRight,
  Download,
  File,
  FilePlus,
  Folder,
  FolderPlus,
  Home,
  Move
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  isFolder: boolean
  parentFolderId: string | null
  folderPath: string
  folderDepth: number
  uploadedAt: string
  encrypted: boolean
  shared: boolean
  accessControl: any
  downloadCount: number
  lastAccessed: string | null
}

interface BreadcrumbItem {
  id: string | null
  name: string
  path: string
}

interface FolderManagerProps {
  onFileSelect?: (file: FileItem) => void
  onFolderSelect?: (folder: FileItem) => void
}

export default function FolderManager({ onFileSelect, onFolderSelect }: FolderManagerProps) {
  const [items, setItems] = useState<FileItem[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([])
  const [loading, setLoading] = useState(false)
  const [createFolderDialog, setCreateFolderDialog] = useState(false)
  const [createFileDialog, setCreateFileDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [newFileContent, setNewFileContent] = useState('')
  const [newFileType, setNewFileType] = useState('text/plain')
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Load items for current folder
  const loadItems = async (folderId: string | null = null) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files?parentFolderId=${folderId || ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load items')
      }

      const data = await response.json()
      setItems(data.data)
      
      // Update breadcrumb if we're in a folder
      if (folderId) {
        await loadBreadcrumb(folderId)
      } else {
        setBreadcrumb([{ id: null, name: 'Root', path: '/' }])
      }
    } catch (error) {
      console.error('Error loading items:', error)
      toast({
        title: "Error",
        description: "Failed to load folder contents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load breadcrumb navigation
  const loadBreadcrumb = async (folderId: string) => {
    try {
      const response = await fetch(`/api/files/folders/${folderId}/breadcrumb`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBreadcrumb(data.breadcrumb)
      }
    } catch (error) {
      console.error('Error loading breadcrumb:', error)
    }
  }

  // Create new folder
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/files/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentFolderId: currentFolderId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create folder')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: `Folder "${data.folder.name}" created successfully`,
      })

      setCreateFolderDialog(false)
      setNewFolderName('')
      loadItems(currentFolderId) // Reload current folder
    } catch (error: any) {
      console.error('Error creating folder:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  // Create new file
  const createFile = async () => {
    if (!newFileName.trim()) {
      toast({
        title: "Error",
        description: "File name is required",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a Blob from the content
      const fileBlob = new Blob([newFileContent], { type: newFileType })
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', fileBlob, newFileName.trim())
      formData.append('parentFolderId', currentFolderId || '')
      formData.append('options', JSON.stringify({ encryption: true }))

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create file')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: `File "${data.file.name}" created successfully`,
      })

      setCreateFileDialog(false)
      setNewFileName('')
      setNewFileContent('')
      setNewFileType('text/plain')
      loadItems(currentFolderId) // Reload current folder
    } catch (error: any) {
      console.error('Error creating file:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create file",
        variant: "destructive",
      })
    }
  }

  // Navigate to folder
  const navigateToFolder = (folder: FileItem) => {
    setCurrentFolderId(folder.id)
    setSelectedItems([])
    loadItems(folder.id)
    if (onFolderSelect) {
      onFolderSelect(folder)
    }
  }

  // Navigate to parent folder
  const navigateToParent = () => {
    const parentId = breadcrumb[breadcrumb.length - 2]?.id || null
    setCurrentFolderId(parentId)
    setSelectedItems([])
    loadItems(parentId)
  }

  // Navigate to breadcrumb item
  const navigateToBreadcrumb = (item: BreadcrumbItem) => {
    setCurrentFolderId(item.id)
    setSelectedItems([])
    loadItems(item.id)
  }

  // Move items to different folder
  const moveItems = async (targetFolderId: string | null) => {
    if (selectedItems.length === 0) return

    try {
      const movePromises = selectedItems.map(itemId =>
        fetch(`/api/files/${itemId}/move`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ targetFolderId }),
        })
      )

      await Promise.all(movePromises)
      
      toast({
        title: "Success",
        description: `${selectedItems.length} item(s) moved successfully`,
      })

      setSelectedItems([])
      loadItems(currentFolderId) // Reload current folder
    } catch (error) {
      console.error('Error moving items:', error)
      toast({
        title: "Error",
        description: "Failed to move items",
        variant: "destructive",
      })
    }
  }

  // Rename item
  const renameItem = async (itemId: string, newName: string) => {
    try {
      const response = await fetch(`/api/files/${itemId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ newName }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to rename item')
      }

      toast({
        title: "Success",
        description: "Item renamed successfully",
      })

      loadItems(currentFolderId) // Reload current folder
    } catch (error: any) {
      console.error('Error renaming item:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to rename item",
        variant: "destructive",
      })
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // Load initial data
  useEffect(() => {
    loadItems()
  }, [])

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToParent()}
            disabled={currentFolderId === null}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentFolderId(null)
              setSelectedItems([])
              loadItems()
            }}
          >
            <Home className="h-4 w-4" />
            Root
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Create File Dialog */}
          <Dialog open={createFileDialog} onOpenChange={setCreateFileDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <FilePlus className="h-4 w-4 mr-2" />
                New File
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fileName">File Name</Label>
                  <Input
                    id="fileName"
                    placeholder="Enter file name"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="fileType">File Type</Label>
                  <Select value={newFileType} onValueChange={setNewFileType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text/plain">Text File (.txt)</SelectItem>
                      <SelectItem value="text/markdown">Markdown (.md)</SelectItem>
                      <SelectItem value="application/json">JSON (.json)</SelectItem>
                      <SelectItem value="text/html">HTML (.html)</SelectItem>
                      <SelectItem value="text/css">CSS (.css)</SelectItem>
                      <SelectItem value="application/javascript">JavaScript (.js)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fileContent">File Content</Label>
                  <Textarea
                    id="fileContent"
                    placeholder="Enter file content..."
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateFileDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFile}>
                    Create File
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Folder Dialog */}
          <Dialog open={createFolderDialog} onOpenChange={setCreateFolderDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    placeholder="Enter folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && createFolder()}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateFolderDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFolder}>
                    Create Folder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Breadcrumb navigation */}
      <div className="flex items-center space-x-1 text-sm">
        {breadcrumb.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
            <button
              onClick={() => navigateToBreadcrumb(item)}
              className="hover:text-blue-600 hover:underline"
            >
              {item.name}
            </button>
          </div>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveItems(null)}
                >
                  <Move className="h-4 w-4 mr-2" />
                  Move to Root
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItems([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items list */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">This folder is empty</p>
              <div className="flex justify-center space-x-2">
                <Button onClick={() => setCreateFileDialog(true)}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  Create File
                </Button>
                <Button onClick={() => setCreateFolderDialog(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-colors ${
                selectedItems.includes(item.id) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleItemSelection(item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {item.isFolder ? (
                      <Folder className="h-6 w-6 text-blue-500" />
                    ) : (
                      <File className="h-6 w-6 text-gray-500" />
                    )}
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.name}</span>
                        {item.encrypted && (
                          <Badge variant="secondary" className="text-xs">
                            Encrypted
                          </Badge>
                        )}
                        {item.isFolder && (
                          <Badge variant="outline" className="text-xs">
                            Folder
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {item.isFolder ? (
                          'Folder'
                        ) : (
                          `${formatFileSize(item.size)} • ${item.type}`
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.isFolder ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation()
                          navigateToFolder(item)
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                        Open
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation()
                          if (onFileSelect) onFileSelect(item)
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 