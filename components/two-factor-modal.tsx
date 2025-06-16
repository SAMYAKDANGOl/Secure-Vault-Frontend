"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Key, Loader2 } from "lucide-react"
import { useState } from "react"

interface TwoFactorModalProps {
  isOpen: boolean
  onClose: () => void
  tempToken: string | null
  email: string
}

export function TwoFactorModal({ isOpen, onClose, tempToken, email }: TwoFactorModalProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { verifyTwoFactor } = useAuth()

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    if (!tempToken) {
      setError("Invalid session. Please try logging in again.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await verifyTwoFactor(tempToken, code)
      onClose()
    } catch (error: any) {
      console.error("MFA verification failed:", error)
      setError(error.message || "Invalid verification code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your Microsoft Authenticator app to verify your identity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="text-center text-lg tracking-widest"
            />
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Lost your device? Use one of your backup recovery codes instead.
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={isLoading || code.length !== 6}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
              Verify
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
