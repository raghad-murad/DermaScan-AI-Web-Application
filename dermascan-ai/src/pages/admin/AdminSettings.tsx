import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiGet, apiPut } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

export default function AdminSettings() {
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    phonenumber: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (isLoadingAuth || !user) return;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    apiGet<any>('/api/users/me')
      .then(profile => {
        if (cancelled) return;
        setForm({
          full_name: profile.full_name || '',
          email: profile.email || '',
          username: profile.username || '',
          phonenumber: profile.phonenumber || '',
        });
      })
      .catch(err => {
        if (cancelled) return;
        setLoadError(err.message || 'Failed to load profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isLoadingAuth, user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await apiPut<any>('/api/users/me', {
        full_name: form.full_name,
        username: form.username,
        phonenumber: form.phonenumber,
      });
      setForm(f => ({ ...f, full_name: updated.full_name || '', username: updated.username || '', phonenumber: updated.phonenumber || '' }));
      toast({ title: 'Profile updated', description: 'Your profile changes have been saved.' });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message || 'Failed to update profile.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setPasswordError('No authenticated user found.');
      return;
    }

    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.current_password);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.new_password);
      setPasswordSuccess('Password updated successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast({ title: 'Password updated', description: 'Your password has been changed.' });
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-medium">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your admin account information</p>
        </div>
        <Card className="border border-border rounded-xl">
          <CardContent className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-4 w-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
            Loading your profile...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-medium">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your admin account information</p>
        </div>
        <Card className="border border-border rounded-xl">
          <CardContent className="p-6 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your admin account information</p>
      </div>

      <Card className="border border-border rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Full Name</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="border-black focus-visible:ring-black dark:border-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Email Address</Label>
              <Input
                type="email"
                value={form.email}
                disabled
                className="bg-muted border-black/40 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">Changing your email requires re-authentication and isn't supported here yet.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Username</Label>
              <Input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="border-black focus-visible:ring-black dark:border-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Phone Number</Label>
              <Input
                value={form.phonenumber}
                onChange={e => setForm({ ...form, phonenumber: e.target.value })}
                className="border-black focus-visible:ring-black dark:border-white"
              />
            </div>

          </div>

          <Button className="rounded-lg mt-2" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-border rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Security & Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">

            {passwordError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
                {passwordSuccess}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Current Password</Label>
              <Input
                type="password"
                value={passwordForm.current_password}
                onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="border-black focus-visible:ring-black dark:border-white"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-primary">New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="border-black focus-visible:ring-black dark:border-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-primary">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="border-black focus-visible:ring-black dark:border-white"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="rounded-lg" disabled={savingPassword}>
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
