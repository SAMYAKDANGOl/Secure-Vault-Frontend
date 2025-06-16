"use client"

import { AccessControlPanel } from "@/components/access-control-panel"
import { AuditLog } from "@/components/audit-log"
import { FileList } from "@/components/file-list"
import { FileSearch } from "@/components/file-search"
import { FileUpload } from "@/components/file-upload"
import { MFASetup } from "@/components/mfa-setup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfile } from "@/components/user-profile"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { Activity, Clock, Files, HardDrive, LogOut, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Stats {
  totalFiles: number
  totalSize: number
  lastUpload: string
  activeShares: number
  securityScore: number
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    totalSize: 0,
    lastUpload: "Never",
    activeShares: 0,
    securityScore: 0,
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchStats()
  }, [user, router, refreshTrigger])

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/stats")
      setStats(response.data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Secure Vault Pro</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Welcome back, {user.user_metadata?.fullName || user.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <Files className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">Files in your vault</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
              <p className="text-xs text-muted-foreground">Total storage used</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shares</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeShares}</div>
              <p className="text-xs text-muted-foreground">Files currently shared</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSecurityScoreColor(stats.securityScore)}`}>
                {stats.securityScore}%
              </div>
              <p className="text-xs text-muted-foreground">Overall security rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lastUpload}</div>
              <p className="text-xs text-muted-foreground">Most recent upload</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="files" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="mfa">MFA</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Files</CardTitle>
                <CardDescription>Manage your encrypted files with advanced security features</CardDescription>
              </CardHeader>
              <CardContent>
                <FileList refreshTrigger={refreshTrigger} onFileDeleted={refreshData} searchQuery={searchQuery} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>Securely upload files with automatic encryption and access control</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onUploadComplete={refreshData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Files</CardTitle>
                <CardDescription>Find your files quickly with advanced search and filtering</CardDescription>
              </CardHeader>
              <CardContent>
                <FileSearch onSearchChange={setSearchQuery} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>Configure dynamic access rules based on time, location, and device</CardDescription>
              </CardHeader>
              <CardContent>
                <AccessControlPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Monitor all file access and security events</CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLog />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Manage your account settings and security preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <UserProfile />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mfa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>MFA Setup</CardTitle>
                <CardDescription>Set up Multi-Factor Authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <MFASetup onStatusChange={refreshData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
