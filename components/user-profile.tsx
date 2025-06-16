"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { Download, Key, Loader2, Shield, Smartphone, User } from "lucide-react"
import { useEffect, useState } from "react"

interface UserSettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  emailNotifications: boolean
  securityAlerts: boolean
  dataRetention: number
}

export function UserProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    emailNotifications: true,
    securityAlerts: true,
    dataRetention: 365,
  })
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [devices, setDevices] = useState<any[]>([])
  const { toast } = useToast()
  const [emailMfaEnabled, setEmailMfaEnabled] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.user_metadata?.fullName || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
        dateOfBirth: user.user_metadata?.dateOfBirth || "",
      })
      fetchSettings()
      fetchDevices()
      setSettings(prev => ({ ...prev, twoFactorEnabled: !!user.user_metadata?.two_factor_enabled }))
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get("/user/settings")
      setSettings(response.data)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await apiClient.get("/user/devices")
      setDevices(response.data || [])
    } catch (error) {
      console.error("Failed to fetch devices:", error)
    }
  }

  const updateProfile = async () => {
    setLoading(true)
    try {
      await apiClient.post("/user/profile", profileData)
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await apiClient.post("/user/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast({
        title: "Success",
        description: "Password updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings }
      await apiClient.post("/user/settings", updatedSettings)
      setSettings(updatedSettings)
      toast({
        title: "Success",
        description: "Settings updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    }
  }

  const revokeDevice = async (deviceId: string) => {
    try {
      await apiClient.delete(`/user/devices/${deviceId}`)
      await fetchDevices()
      toast({
        title: "Success",
        description: "Device access revoked",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke device access",
        variant: "destructive",
      })
    }
  }

  const exportData = async () => {
    try {
      const response = await apiClient.get("/user/export")
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "secure-vault-data.json"
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Data exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  const enableEmailMfa = async () => {
    if (!user) return;
    const res = await fetch("/api/auth/mfa/setup-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    if (data.success) {
      setEmailMfaEnabled(true);
      toast({
        title: "Email MFA enabled!",
        description: "You'll be asked for a code on your next login.",
      });
    } else {
      toast({
        title: "Error",
        description: data.error || "Failed to enable Email MFA",
        variant: "destructive",
      });
    }
  };

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="devices">Devices</TabsTrigger>
        <TabsTrigger value="privacy">Privacy</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Profile Information
            </CardTitle>
            <CardDescription>Update your account profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Two-Factor Authentication
            </CardTitle>
            <CardDescription>Enhance your account security with two-factor authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mt-4">
              <div>
                <h4 className="font-medium">Email OTP (One-Time Password)</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use a 6-digit code sent to your email for extra security
                </p>
              </div>
              <Button onClick={enableEmailMfa} disabled={emailMfaEnabled}>
                {emailMfaEnabled ? "Enabled" : "Enable Email MFA"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {emailMfaEnabled
                ? "Email MFA is enabled. You'll be asked for a code on your next login."
                : "Enable email-based two-factor authentication for additional security."}
            </p>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="devices" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authorized Devices</CardTitle>
            <CardDescription>Manage devices that have access to your account</CardDescription>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No devices found</p>
            ) : (
              <div className="space-y-4">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">{device.name || "Unknown Device"}</h4>
                        <p className="text-sm text-gray-500">{device.userAgent}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary">{device.location}</Badge>
                          <span className="text-xs text-gray-400">
                            Last seen: {new Date(device.lastSeen).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => revokeDevice(device.id)}>
                      Revoke Access
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="privacy" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Data</CardTitle>
            <CardDescription>Control your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Data Retention (days)</Label>
              <Input
                type="number"
                value={settings.dataRetention}
                onChange={(e) => updateSettings({ dataRetention: Number.parseInt(e.target.value) })}
                min="30"
                max="3650"
              />
              <p className="text-sm text-gray-500">How long to keep your files after deletion</p>
            </div>

            <div className="space-y-4">
              <Button onClick={exportData} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export My Data
              </Button>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your data is encrypted and stored securely. We never share your information with third parties.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
