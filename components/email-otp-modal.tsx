import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface EmailOtpModalProps {
  isOpen: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
  error?: string;
}

export function EmailOtpModal({ isOpen, onVerify, onResend, error }: EmailOtpModalProps) {
  const [code, setCode] = useState('');
  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter the 6-digit code sent to your email</DialogTitle>
        </DialogHeader>
        <Input value={code} onChange={e => setCode(e.target.value)} maxLength={6} placeholder="123456" />
        {error && <Alert>{error}</Alert>}
        <div className="flex gap-2 mt-4">
          <Button onClick={() => onVerify(code)}>Verify</Button>
          <Button onClick={onResend} variant="outline">Resend Code</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 