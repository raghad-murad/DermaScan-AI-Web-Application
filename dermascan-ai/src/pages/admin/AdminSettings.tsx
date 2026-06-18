import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminSettings() {
  const { user, isLoadingAuth, updateUserProfile } = useAuth();

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

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phonenumber: user.phonenumber || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    const uid = user?.uid || user?.id;
    if (!uid) return;

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const updates = {
        full_name: form.full_name,
        username: form.username,
        phonenumber: form.phonenumber,
      };
      await updateDoc(doc(db, 'users', uid), updates);
      updateUserProfile(updates);
      setSaveSuccess('Profile updated successfully!');
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await base44.auth.updatePassword({
        currentPassword: passwordForm.current_password,
        newPassword: passwordForm.new_password,
      });
      setPasswordSuccess('Password updated successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoadingAuth || !user) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-medium">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your admin account information</p>
        </div>
        <Card className="border border-border rounded-xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading your profile...
          </CardContent>
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
          {saveError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
              {saveSuccess}
            </div>
          )}

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
