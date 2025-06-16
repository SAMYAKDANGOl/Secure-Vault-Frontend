"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
    AlertCircle,
    CheckCircle,
    Key,
    Loader2,
    Shield,
    Smartphone,
    XCircle
} from "lucide-react"
import { useState } from "react"

interface MFAVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
  action: string
  actionDescription: string
}

export function MFAVerification({ 
  open, 
  onOpenChange, 
  onVerified, 
  action, 
  actionDescription 
}: MFAVerificationProps) {
  const [verificationToken, setVerificationToken] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleVerify = async () => {
    if (!verificationToken.trim() && !backupCode.trim()) {
      setError("Please enter a verification token or backup code")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulate verification - in real implementation, this would call the backend
      // For now, we'll just simulate a successful verification
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onVerified()
      onOpenChange(false)
      setVerificationToken("")
      setBackupCode("")
      
      toast({
        title: "MFA Verified",
        description: "Two-factor authentication verified successfully",
      })
    } catch (error: any) {
      setError(error.message || "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setVerificationToken("")
    setBackupCode("")
    setError(null)
    onOpenChange(false)
  }

  const getActionIcon = () => {
    switch (action) {
      case "file_upload":
        return "📤"
      case "file_download":
        return "📥"
      case "file_delete":
        return "🗑️"
      case "file_share":
        return "🔗"
      case "file_encrypt":
        return "🔐"
      case "file_decrypt":
        return "🔓"
      case "settings_change":
        return "⚙️"
      case "password_change":
        return "🔑"
      default:
        return "🔒"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Two-Factor Authentication Required
          </DialogTitle>
          <DialogDescription>
            {getActionIcon()} {actionDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action requires two-factor authentication verification
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="token" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="token">
                <Smartphone className="h-4 w-4 mr-2" />
                Token
              </TabsTrigger>
              <TabsTrigger value="backup">
                <Key className="h-4 w-4 mr-2" />
                Backup Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="token" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-token">Verification Token</Label>
                <Input
                  id="mfa-token"
                  type="text"
                  placeholder="Enter 6-digit code from your authenticator app"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  maxLength={6}
                  autoFocus
                />
                <p className="text-sm text-gray-500">
                  Enter the 6-digit code from Microsoft Authenticator or your TOTP app
                </p>
              </div>
            </TabsContent>

            <TabsContent value="backup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-code">Backup Code</Label>
                <Input
                  id="backup-code"
                  type="text"
                  placeholder="Enter your backup code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  autoFocus
                />
                <p className="text-sm text-gray-500">
                  Enter one of your backup codes (single-use)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerify} 
              disabled={isLoading || (!verificationToken.trim() && !backupCode.trim())}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Verify
                </div>
              )}
            </Button>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Security Notice
            </h4>
            <p className="text-xs text-gray-600">
              This verification is required for sensitive operations to protect your account and files.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 