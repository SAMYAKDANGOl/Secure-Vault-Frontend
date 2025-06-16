"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import {
    AlertCircle,
    CheckCircle,
    Copy,
    Download,
    Eye,
    EyeOff,
    Key,
    Shield,
    Smartphone,
    XCircle
} from "lucide-react"
import { useEffect, useState } from "react"

interface MFASetupProps {
  onStatusChange: () => void
}

export function MFASetup({ onStatusChange }: MFASetupProps) {
  const [mfaStatus, setMfaStatus] = useState<{
    mfaEnabled: boolean
    backupCodesRemaining: number
  } | null>(null)
  const [setupData, setSetupData] = useState<{
    qrCode: string
    secret: string
    backupCodes: string[]
  } | null>(null)
  const [verificationToken, setVerificationToken] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchMFAStatus()
  }, [])

  const fetchMFAStatus = async () => {
    try {
      const response = await apiClient.get("/mfa/status")
      // Defensive: check for valid data
      if (
        response.data &&
        typeof response.data.mfaEnabled === "boolean" &&
        typeof response.data.backupCodesRemaining === "number"
      ) {
        setMfaStatus({
          mfaEnabled: response.data.mfaEnabled,
          backupCodesRemaining: response.data.backupCodesRemaining,
        })
      } else {
        setMfaStatus({ mfaEnabled: false, backupCodesRemaining: 0 })
      }
    } catch (error) {
      console.error("Failed to fetch MFA status:", error)
      setMfaStatus({ mfaEnabled: false, backupCodesRemaining: 0 })
    }
  }

  const handleSetupMFA = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await apiClient.post("/mfa/setup")
      console.log("MFA setup response:", response.data)
      setSetupData(response.data)
      toast({
        title: "MFA Setup Initiated",
        description: "Scan the QR code with your authenticator app",
      })
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to setup MFA" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyMFA = async () => {
    if (!verificationToken.trim() && !backupCode.trim()) {
      setMessage({ type: "error", text: "Please enter a verification token or backup code" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await apiClient.post("/mfa/verify", {
        token: verificationToken.trim() || undefined,
        backupCode: backupCode.trim() || undefined
      })

      setMessage({ type: "success", text: "MFA enabled successfully!" })
      setSetupData(null)
      setVerificationToken("")
      setBackupCode("")
      fetchMFAStatus()
      onStatusChange()

      toast({
        title: "MFA Enabled",
        description: "Two-factor authentication is now active",
      })
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to verify MFA" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableMFA = async () => {
    if (!verificationToken.trim() && !backupCode.trim()) {
      setMessage({ type: "error", text: "Please enter a verification token or backup code" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await apiClient.post("/mfa/disable", {
        token: verificationToken.trim() || undefined,
        backupCode: backupCode.trim() || undefined
      })

      setMessage({ type: "success", text: "MFA disabled successfully!" })
      setVerificationToken("")
      setBackupCode("")
      fetchMFAStatus()
      onStatusChange()

      toast({
        title: "MFA Disabled",
        description: "Two-factor authentication has been disabled",
      })
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to disable MFA" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateBackupCodes = async () => {
    if (!verificationToken.trim()) {
      setMessage({ type: "error", text: "Please enter a verification token" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await apiClient.post("/mfa/backup-codes", {
        token: verificationToken.trim()
      })

      setMessage({ type: "success", text: "New backup codes generated!" })
      setVerificationToken("")
      fetchMFAStatus()

      toast({
        title: "Backup Codes Generated",
        description: "New backup codes have been created",
      })
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to generate backup codes" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return

    const content = `Secure Vault Pro - Backup Codes\n\n${setupData.backupCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'backup-codes.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (!mfaStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading MFA status...</span>
      </div>
    )
  }

  if (setupData && setupData.qrCode) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Scan the QR code below with Microsoft Authenticator or any TOTP app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-4">Scan QR Code</h3>
            <div className="bg-white p-4 rounded-lg border inline-block">
              <img 
                src={setupData.qrCode} 
                alt="MFA QR Code" 
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Scan this QR code with Microsoft Authenticator or any TOTP app
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Manual Entry Secret
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type={showSecret ? "text" : "password"}
                value={setupData.secret}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(setupData.secret)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Backup Codes
            </Label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                  Save these backup codes in a secure location
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBackupCodes}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {showBackupCodes && (
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-token">Verification Token</Label>
            <Input
              id="verification-token"
              type="text"
              placeholder="Enter 6-digit code from your authenticator app"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value)}
              maxLength={6}
            />
            <p className="text-sm text-gray-500">
              Enter the 6-digit code from your authenticator app to complete setup
            </p>
          </div>

          <Button 
            onClick={handleVerifyMFA} 
            disabled={isLoading || (!verificationToken.trim() && !backupCode.trim())}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verifying...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Enable MFA
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account using Microsoft Authenticator or any TOTP app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">MFA Status</h3>
            <p className="text-sm text-gray-500">
              {mfaStatus.mfaEnabled ? "Two-factor authentication is enabled" : "Two-factor authentication is disabled"}
            </p>
          </div>
          <Badge variant={mfaStatus.mfaEnabled ? "default" : "secondary"}>
            {mfaStatus.mfaEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        {mfaStatus.mfaEnabled && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Backup Codes</h4>
            <p className="text-sm text-blue-700">
              You have {mfaStatus.backupCodesRemaining} backup codes remaining. 
              Generate new ones if needed.
            </p>
          </div>
        )}

        <Tabs defaultValue={mfaStatus.mfaEnabled ? "manage" : "setup"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup" disabled={mfaStatus.mfaEnabled}>
              <Smartphone className="h-4 w-4 mr-2" />
              Setup MFA
            </TabsTrigger>
            <TabsTrigger value="manage" disabled={!mfaStatus.mfaEnabled}>
              <Key className="h-4 w-4 mr-2" />
              Manage MFA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            {!setupData ? (
              <div className="text-center py-8">
                <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Setup Two-Factor Authentication</h3>
                <p className="text-gray-500 mb-4">
                  Enhance your account security by enabling two-factor authentication
                </p>
                <Button onClick={handleSetupMFA} disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Setting up...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Setup MFA
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-4">Scan QR Code</h3>
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <img 
                      src={setupData.qrCode} 
                      alt="MFA QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Scan this QR code with Microsoft Authenticator or any TOTP app
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Manual Entry Secret
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showSecret ? "text" : "password"}
                      value={setupData.secret}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(setupData.secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Backup Codes
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">
                        Save these backup codes in a secure location
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBackupCodes(!showBackupCodes)}
                        >
                          {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadBackupCodes}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {showBackupCodes && (
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        {setupData.backupCodes.map((code, index) => (
                          <div key={index} className="bg-white p-2 rounded border">
                            {code}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification-token">Verification Token</Label>
                  <Input
                    id="verification-token"
                    type="text"
                    placeholder="Enter 6-digit code from your authenticator app"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    maxLength={6}
                  />
                  <p className="text-sm text-gray-500">
                    Enter the 6-digit code from your authenticator app to complete setup
                  </p>
                </div>

                <Button 
                  onClick={handleVerifyMFA} 
                  disabled={isLoading || (!verificationToken.trim() && !backupCode.trim())}
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Enable MFA
                    </div>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disable-token">Verification Token</Label>
                <Input
                  id="disable-token"
                  type="text"
                  placeholder="Enter 6-digit code from your authenticator app"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disable-backup">Or Backup Code</Label>
                <Input
                  id="disable-backup"
                  type="text"
                  placeholder="Enter backup code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleDisableMFA} 
                  disabled={isLoading || (!verificationToken.trim() && !backupCode.trim())}
                  variant="destructive"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Disabling...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Disable MFA
                    </div>
                  )}
                </Button>

                <Button 
                  onClick={handleGenerateBackupCodes} 
                  disabled={isLoading || !verificationToken.trim()}
                  variant="outline"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      New Backup Codes
                    </div>
                  )}
                </Button>
              </div>
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
            <li>• Use Microsoft Authenticator, Google Authenticator, or any TOTP app</li>
            <li>• Backup codes are single-use and should be kept secure</li>
            <li>• MFA is required for sensitive operations like file encryption</li>
            <li>• You can disable MFA anytime with a valid token or backup code</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 