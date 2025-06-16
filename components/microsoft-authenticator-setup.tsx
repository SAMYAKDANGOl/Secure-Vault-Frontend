"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Copy, Loader2, Shield, Smartphone } from "lucide-react"
import { useEffect, useState } from "react"

interface MFASetupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId?: string
}

export function MicrosoftAuthenticatorSetup({ isOpen, onClose, onSuccess, userId }: MFASetupProps) {
  const [step, setStep] = useState<"setup" | "verify" | "complete">("setup")
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [secret, setSecret] = useState<string>("")
  const [verificationCode, setVerificationCode] = useState<string>("")
  const [error, setError] = useState<string>("")
  const { toast } = useToast()
  const { session } = useAuth()

  useEffect(() => {
    if (isOpen && step === "setup") {
      generateMFASecret()
    }
  }, [isOpen, step])

  const generateMFASecret = async () => {
    try {
      setLoading(true)
      setError("")

      if (!session?.access_token) {
        throw new Error("No authentication token available")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/mfa/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate MFA secret")
      }

      setSecret(data.secret)
      setQrCodeUrl(data.qrCode)
    } catch (error: any) {
      console.error("MFA setup error:", error)
      setError(error.message || "Failed to setup MFA")
      toast({
        title: "Setup failed",
        description: "Could not generate MFA secret",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const verifyMFA = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }

    try {
      setLoading(true)
      setError("")

      if (!session?.access_token) {
        throw new Error("No authentication token available")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/mfa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid verification code")
      }

      setStep("complete")
      toast({
        title: "MFA enabled",
        description: "Microsoft Authenticator has been successfully configured",
      })
    } catch (error: any) {
      console.error("MFA verification error:", error)
      setError(error.message || "Invalid verification code")
    } finally {
      setLoading(false)
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
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleComplete = () => {
    onSuccess()
    onClose()
    setStep("setup")
    setVerificationCode("")
    setError("")
  }

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="h-12 w-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-semibold mb-2">Set up Microsoft Authenticator</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Scan the QR code with Microsoft Authenticator app or enter the secret key manually
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Generating setup code...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scan QR Code</CardTitle>
              <CardDescription>Open Microsoft Authenticator and scan this QR code</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {qrCodeUrl && <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />}
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Manual Entry</CardTitle>
              <CardDescription>If you can't scan the QR code, enter this secret key manually</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(secret)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Download Microsoft Authenticator from your app store</li>
                <li>Open the app and tap "Add account"</li>
                <li>Select "Work or school account" or "Other account (Google, Facebook, etc.)"</li>
                <li>Scan the QR code or enter the secret key manually</li>
                <li>Enter the 6-digit code from the app below</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => setStep("verify")} className="flex-1">
              I've Added the Account
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
        <h3 className="text-lg font-semibold mb-2">Verify Setup</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Enter the 6-digit code from Microsoft Authenticator to complete setup
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verificationCode">Verification Code</Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6)
              setVerificationCode(value)
              setError("")
            }}
            maxLength={6}
            className="text-center text-2xl tracking-widest font-mono"
            autoComplete="one-time-code"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep("setup")} className="flex-1">
            Back
          </Button>
          <Button onClick={verifyMFA} disabled={loading || verificationCode.length !== 6} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Enable
          </Button>
        </div>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
        <h3 className="text-lg font-semibold mb-2">MFA Enabled Successfully!</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Your account is now protected with two-factor authentication
        </p>
      </div>

      <Button onClick={handleComplete} className="w-full">
        Complete Setup
      </Button>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>Secure your account with Microsoft Authenticator</DialogDescription>
        </DialogHeader>

        {step === "setup" && renderSetupStep()}
        {step === "verify" && renderVerifyStep()}
        {step === "complete" && renderCompleteStep()}
      </DialogContent>
    </Dialog>
  )
} 