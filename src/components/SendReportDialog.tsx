import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Send, Loader2 } from "lucide-react";

interface SendReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultEmail?: string;
}

const SendReportDialog = ({ open, onOpenChange, userId, defaultEmail = "" }: SendReportDialogProps) => {
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        "https://cuokuocytxkftvalglnh.supabase.co/functions/v1/send-weekly-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1b2t1b2N5dHhrZnR2YWxnbG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjYxNjksImV4cCI6MjA3NjAwMjE2OX0.CsmUsrNxrvkFP9pjU5QgJWEvMfeWjaafHS1zOKtMxeg`,
          },
          body: JSON.stringify({
            user_id: userId,
            recipient_email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send report");
      }

      toast.success("Weekly report sent successfully!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending report:", error);
      toast.error(error.message || "Failed to send report");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Weekly Report
          </DialogTitle>
          <DialogDescription>
            Send your study stats from this week to your coach or parent.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email</Label>
            <Input
              id="recipient-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@example.com"
            />
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Report includes:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Questions attempted & correct this week</li>
              <li>Accuracy percentage</li>
              <li>Tests completed</li>
              <li>Average response time</li>
              <li>Current streak</li>
              <li>Week-over-week comparison</li>
              <li>Daily activity grid</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendReportDialog;
