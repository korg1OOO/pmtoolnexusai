import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Palette,
  Shield,
  Settings,
  Camera,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  Key,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Laptop,
  Check,
  X,
  LogOut,
  Globe,
  Clock,
  Inbox,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { EmailAccountSettings } from '@/components/communications/EmailAccountSettings';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useForm } from 'react-hook-form';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent?: string;
  ip?: string;
  last_sign_in_at?: string;
}

// Mocks removed - Session management handled by Supabase Auth


export default function UserSettingsView() {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme } = useTheme();

  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Simple local state for form values to allow editing
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    department: '',
    title: '', // using title as 'location' or similar if needed, or just job title
    avatar_url: ''
  });

  const { preferences, updatePreference } = useUserPreferences();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Sync preferences to local state when loaded
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
      // Also update form data with extended profile info if available
      setFormData(prev => ({
        ...prev,
        phone_number: preferences.profile_extended?.phone_number || prev.phone_number,
        department: preferences.profile_extended?.department || prev.department,
        title: preferences.profile_extended?.title || prev.title,
        bio: preferences.profile_extended?.bio || '',
      }));
    }
  }, [preferences]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || prev.full_name,
        email: profile.email || prev.email,
        avatar_url: profile.avatar_url || prev.avatar_url
      }));
    }
  }, [profile]);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false);
  const [mfaQrUri, setMfaQrUri] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaEnrollId, setMfaEnrollId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaStep, setMfaStep] = useState<'qr' | 'verify' | 'disable'>('qr');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  useEffect(() => {
    // Check MFA status
    const checkMfa = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data.all.length > 0) {
        const verified = data.all.find(f => f.status === 'verified');
        setMfaEnabled(!!verified);
        setMfaFactorId(verified?.id ?? null);
      }
    };
    checkMfa();

    // Fetch current session — displays real auth session info
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setActiveSessions([{
          id: data.session.access_token.substring(0, 8) + '...', // token prefix as identifier
          created_at: data.session.user.created_at,
          updated_at: data.session.user.updated_at ?? data.session.user.created_at,
          user_agent: navigator.userAgent,
          last_sign_in_at: data.session.user.last_sign_in_at ?? data.session.user.created_at
        }]);
      }
    };
    getSession();

  }, []);

  const handleSave = async () => {
    // Update basic profile
    updateProfile.mutate({
      full_name: formData.full_name,
      avatar_url: formData.avatar_url
    });

    // Update extended profile info
    updatePreference.mutate({
      key: 'profile_extended',
      value: {
        phone_number: formData.phone_number,
        department: formData.department,
        title: formData.title,
        // bio: formData.bio // If we had bio in formData
      }
    });

    toast.success("Settings saved");
  };

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-card">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Inbox className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback className="text-xl">
                      {(formData.full_name || '?').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior Project Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        className="pl-9 bg-muted text-muted-foreground"
                        value={formData.email}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        className="pl-9"
                        value={formData.phone_number}
                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="department"
                        className="pl-9"
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={preferences?.profile_extended?.bio || ''}
                    onChange={(e) => updatePreference.mutate({
                      key: 'profile_extended',
                      value: { ...preferences?.profile_extended, bio: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <EmailAccountSettings />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure which emails you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Task Assignments', description: 'When you are assigned to a new task', key: 'taskAssignments' },
                  { label: 'Due Date Reminders', description: 'Reminders before tasks are due', key: 'dueReminders' },
                  { label: 'Meeting Invites', description: 'When you are invited to meetings', key: 'meetingInvites' },
                  { label: 'SLA Warnings', description: 'When issues are approaching SLA breach', key: 'slaWarnings' },
                  { label: 'Weekly Digest', description: 'Summary of project activity', key: 'weeklyDigest' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                    <Switch
                      checked={preferences?.notifications?.email?.[item.key as keyof typeof preferences.notifications.email] ?? true}
                      onCheckedChange={(checked) => {
                        const currentEmailPrefs = preferences?.notifications?.email || {};
                        updatePreference.mutate({
                          key: 'notifications',
                          value: {
                            ...preferences?.notifications,
                            email: { ...currentEmailPrefs, [item.key]: checked }
                          }
                        });
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Control in-app and mobile notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Desktop Notifications', description: 'Show notifications on your desktop', key: 'desktop' },
                  { label: 'Mobile Push', description: 'Send notifications to mobile app', key: 'mobile' },
                  { label: 'Sound Alerts', description: 'Play sound for notifications', key: 'sound' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                    <Switch
                      checked={preferences?.notifications?.push?.[item.key as keyof typeof preferences.notifications.push] ?? true}
                      onCheckedChange={(checked) => {
                        const currentPushPrefs = preferences?.notifications?.push || {};
                        updatePreference.mutate({
                          key: 'notifications',
                          value: {
                            ...preferences?.notifications,
                            push: { ...currentPushPrefs, [item.key]: checked }
                          }
                        });
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Choose your preferred color scheme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Laptop },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                      className={cn(
                        'flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all',
                        theme === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <option.icon className={cn(
                        'h-6 w-6',
                        theme === option.value ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <span className={cn(
                        'font-medium text-sm',
                        theme === option.value ? 'text-primary' : 'text-foreground'
                      )}>
                        {option.label}
                      </span>
                      {theme === option.value && (
                        <Badge className="bg-primary text-primary-foreground">Active</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>Customize your viewing experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Compact Mode</div>
                    <div className="text-xs text-muted-foreground">Show more content with less spacing</div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Animations</div>
                    <div className="text-xs text-muted-foreground">Enable smooth transitions and effects</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">High Contrast</div>
                    <div className="text-xs text-muted-foreground">Increase contrast for better readability</div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <div className="font-medium">{mfaEnabled ? '2FA is enabled' : '2FA is disabled'}</div>
                      <div className="text-sm text-muted-foreground">{mfaEnabled ? 'Your account is secured.' : 'Enable 2FA for better security.'}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (mfaEnabled) {
                        // Open disable confirmation
                        setMfaStep('disable');
                        setMfaCode('');
                        setMfaDialogOpen(true);
                      } else {
                        // Enroll a new TOTP factor
                        setMfaLoading(true);
                        try {
                          const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
                          if (error) throw error;
                          setMfaQrUri(data.totp.qr_code);
                          setMfaSecret(data.totp.secret);
                          setMfaEnrollId(data.id);
                          setMfaStep('qr');
                          setMfaCode('');
                          setMfaDialogOpen(true);
                        } catch (err: any) {
                          toast.error(`Failed to start MFA enrollment: ${err.message}`);
                        } finally {
                          setMfaLoading(false);
                        }
                      }
                    }}
                    disabled={mfaLoading}
                  >
                    {mfaLoading ? 'Loading...' : mfaEnabled ? 'Manage 2FA' : 'Configure'}
                  </Button>

                  {/* MFA Dialog */}
                  {mfaDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setMfaDialogOpen(false)}>
                      <div className="bg-background border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        {mfaStep === 'qr' && (
                          <>
                            <h3 className="text-lg font-semibold">Set Up Two-Factor Authentication</h3>
                            <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy).</p>
                            <div className="flex justify-center bg-white p-4 rounded-lg">
                              <img src={mfaQrUri} alt="TOTP QR Code" className="w-40 h-40" />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">Or enter the secret manually: <code className="bg-muted px-1 rounded">{mfaSecret}</code></p>
                            <button className="w-full text-sm text-primary underline" onClick={() => setMfaStep('verify')}>I've scanned the code — enter verification code →</button>
                            <button className="text-xs text-muted-foreground" onClick={() => setMfaDialogOpen(false)}>Cancel</button>
                          </>
                        )}
                        {mfaStep === 'verify' && (
                          <>
                            <h3 className="text-lg font-semibold">Verify Your Authenticator</h3>
                            <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app to complete setup.</p>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="000000"
                              value={mfaCode}
                              onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                              className="w-full border rounded px-3 py-2 text-center text-xl tracking-widest bg-background"
                              aria-label="TOTP verification code"
                            />
                            <div className="flex gap-2">
                              <button className="flex-1 border rounded px-3 py-2 text-sm" onClick={() => setMfaStep('qr')}>← Back</button>
                              <button
                                className="flex-1 bg-primary text-primary-foreground rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
                                disabled={mfaCode.length !== 6 || mfaLoading}
                                onClick={async () => {
                                  setMfaLoading(true);
                                  try {
                                    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: mfaEnrollId });
                                    if (challengeErr) throw challengeErr;
                                    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId: mfaEnrollId, challengeId: challengeData.id, code: mfaCode });
                                    if (verifyErr) throw verifyErr;
                                    setMfaEnabled(true);
                                    setMfaFactorId(mfaEnrollId);
                                    setMfaDialogOpen(false);
                                    toast.success('Two-factor authentication enabled successfully!');
                                  } catch (err: any) {
                                    toast.error(`Verification failed: ${err.message}`);
                                  } finally {
                                    setMfaLoading(false);
                                  }
                                }}
                              >
                                {mfaLoading ? 'Verifying...' : 'Enable 2FA'}
                              </button>
                            </div>
                          </>
                        )}
                        {mfaStep === 'disable' && (
                          <>
                            <h3 className="text-lg font-semibold">Disable Two-Factor Authentication</h3>
                            <p className="text-sm text-muted-foreground">Enter your current TOTP code to confirm disabling 2FA. This will reduce your account security.</p>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="000000"
                              value={mfaCode}
                              onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                              className="w-full border rounded px-3 py-2 text-center text-xl tracking-widest bg-background"
                              aria-label="TOTP code to confirm disabling 2FA"
                            />
                            <div className="flex gap-2">
                              <button className="flex-1 border rounded px-3 py-2 text-sm" onClick={() => setMfaDialogOpen(false)}>Cancel</button>
                              <button
                                className="flex-1 bg-destructive text-destructive-foreground rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
                                disabled={mfaCode.length !== 6 || mfaLoading || !mfaFactorId}
                                onClick={async () => {
                                  if (!mfaFactorId) return;
                                  setMfaLoading(true);
                                  try {
                                    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
                                    if (challengeErr) throw challengeErr;
                                    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challengeData.id, code: mfaCode });
                                    if (verifyErr) throw verifyErr;
                                    const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
                                    if (unenrollErr) throw unenrollErr;
                                    setMfaEnabled(false);
                                    setMfaFactorId(null);
                                    setMfaDialogOpen(false);
                                    toast.success('Two-factor authentication disabled.');
                                  } catch (err: any) {
                                    toast.error(`Failed to disable 2FA: ${err.message}`);
                                  } finally {
                                    setMfaLoading(false);
                                  }
                                }}
                              >
                                {mfaLoading ? 'Processing...' : 'Disable 2FA'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Recovery Codes</Label>
                  <p className="text-sm text-muted-foreground">
                    Download backup codes in case you lose access to your authenticator
                  </p>
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    View Recovery Codes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Session</CardTitle>
                <CardDescription>Your active login session. To manage sessions across devices, sign out and back in from each device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeSessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Current Session</p>
                      <p className="text-xs text-muted-foreground">{session.user_agent}</p>
                      <p className="text-xs text-muted-foreground">Last active: {new Date(session.last_sign_in_at || '').toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </div>
                ))}
                {activeSessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active session info available</p>}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password (optional for some providers)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
                <Button onClick={handleUpdatePassword} disabled={updatingPassword}>
                  {updatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>Configure your locale preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English (US)</SelectItem>
                        <SelectItem value="en-gb">English (UK)</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="est">
                      <SelectTrigger>
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                        <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                        <SelectItem value="cst">Central Time (CT)</SelectItem>
                        <SelectItem value="est">Eastern Time (ET)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
