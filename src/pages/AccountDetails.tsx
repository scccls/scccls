import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, Mail, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const AccountDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [coachEmail, setCoachEmail] = useState("");
  const [originalCoachEmail, setOriginalCoachEmail] = useState("");
  const [autoSendReport, setAutoSendReport] = useState(false);
  const [originalAutoSendReport, setOriginalAutoSendReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username, coach_email, auto_send_report")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setUsername(data.username);
        setOriginalUsername(data.username);
        setCoachEmail(data.coach_email || "");
        setOriginalCoachEmail(data.coach_email || "");
        setAutoSendReport(data.auto_send_report);
        setOriginalAutoSendReport(data.auto_send_report);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    // Validate coach email if auto-send is enabled
    if (autoSendReport && !coachEmail.trim()) {
      toast.error("Please enter a coach email to enable automatic reports");
      return;
    }

    if (coachEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(coachEmail.trim())) {
        toast.error("Please enter a valid coach email address");
        return;
      }
    }

    setSaving(true);
    
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const profileData = {
      username: username.trim(),
      coach_email: coachEmail.trim() || null,
      auto_send_report: autoSendReport,
    };

    let error;
    if (existing) {
      const result = await supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", user.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("profiles")
        .insert({ user_id: user.id, ...profileData });
      error = result.error;
    }

    if (error) {
      toast.error("Failed to save profile");
      console.error(error);
    } else {
      toast.success("Profile saved successfully!");
      setOriginalUsername(username.trim());
      setOriginalCoachEmail(coachEmail.trim());
      setOriginalAutoSendReport(autoSendReport);
    }

    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    setSendingReset(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email!");
    }

    setSendingReset(false);
  };

  const hasChanges = username !== originalUsername || 
    coachEmail !== originalCoachEmail || 
    autoSendReport !== originalAutoSendReport;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Account Details</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your username and view your email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">Email cannot be changed</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Report Settings</CardTitle>
          <CardDescription>Configure automatic weekly reports to your coach or parent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coach-email">Coach/Parent Email</Label>
            <Input
              id="coach-email"
              type="email"
              value={coachEmail}
              onChange={(e) => setCoachEmail(e.target.value)}
              placeholder="coach@example.com"
            />
            <p className="text-sm text-muted-foreground">
              Your weekly study report will be sent to this email
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-send">Automatic Weekly Report</Label>
              <p className="text-sm text-muted-foreground">
                Send report automatically every Sunday
              </p>
            </div>
            <Switch
              id="auto-send"
              checked={autoSendReport}
              onCheckedChange={setAutoSendReport}
              disabled={!coachEmail.trim()}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Reset your password via email</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={handleResetPassword}
            disabled={sendingReset}
          >
            <Mail className="h-4 w-4 mr-2" />
            {sendingReset ? "Sending..." : "Send Password Reset Email"}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            We'll send a password reset link to {user?.email}
          </p>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AccountDetails;
