import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiPut, apiPost } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

export default function DoctorSettings() {
  const { toast } = useToast();
  const { user, isLoadingAuth, updateUserProfile } = useAuth();

  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeReason, setEmailChangeReason] = useState('');
  const [submittingEmailChange, setSubmittingEmailChange] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    phonenumber: '',
    specialty: '',
    hospital: '',
    license_number: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [saving, setSaving] = useState(false);
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
        specialty: user.specialty || '',
        hospital: user.hospital || '',
        license_number: user.license_number || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await apiPut<any>('/api/users/me', {
        full_name: form.full_name,
        username: form.username,
        phonenumber: form.phonenumber,
        hospital: form.hospital,
        license_number: form.license_number,
      });
      setForm(f => ({
        ...f,
        full_name: updated.full_name || '',
        username: updated.username || '',
        phonenumber: updated.phonenumber || '',
        hospital: updated.hospital || '',
        license_number: updated.license_number || '',
      }));
      updateUserProfile(updated);
      toast({ title: 'Profile updated', description: 'Your profile changes have been saved.' });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message || 'Failed to update profile.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestEmailChange = async () => {
    setSubmittingEmailChange(true);
    try {
      await apiPost('/api/support-tickets/', {
        subject: 'Email Change Request',
        message: `Doctor requests email change from ${form.email} to ${newEmail}. Reason: ${emailChangeReason || 'Not specified'}`,
      });
      toast({ title: 'Your request has been sent to the admin' });
      setShowEmailChange(false);
      setNewEmail('');
      setEmailChangeReason('');
    } catch (err: any) {
      toast({ title: 'Request failed', description: err.message || 'Could not submit your request.', variant: 'destructive' });
    } finally {
      setSubmittingEmailChange(false);
    }
  };

  const handleRequestDeletion = async () => {
    setRequestingDeletion(true);
    try {
      await apiPost('/api/support-tickets/delete-account');
      toast({ title: 'Your deletion request has been sent to the admin' });
      setShowDeleteConfirm(false);
    } catch (err: any) {
      toast({ title: 'Request failed', description: err.message || 'Could not submit your request.', variant: 'destructive' });
    } finally {
      setRequestingDeletion(false);
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

  if (isLoadingAuth || !user) {
    return (
      <div>
        <DoctorTopbar title="Settings" />
        <div className="p-6 max-w-3xl mx-auto space-y-6">
          <Card className="border border-border rounded-xl">
            <CardContent className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-4 w-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
              Loading your profile...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DoctorTopbar title="Settings" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">

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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg mt-1"
                  onClick={() => { setNewEmail(''); setEmailChangeReason(''); setShowEmailChange(true); }}
                >
                  Request Email Change
                </Button>
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

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-primary">Medical Specialty</Label>
                <Input
                  value={form.specialty}
                  disabled
                  className="bg-muted border-black/40 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-primary">Hospital / Institution</Label>
                <Input
                  value={form.hospital}
                  onChange={e => setForm({ ...form, hospital: e.target.value })}
                  className="border-black focus-visible:ring-black dark:border-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-primary">Medical License Number</Label>
                <Input
                  value={form.license_number}
                  onChange={e => setForm({ ...form, license_number: e.target.value })}
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

        <Card className="border-2 border-destructive rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Requesting account deletion will permanently remove your account and all associated data once approved by an admin. This cannot be undone.
            </p>
            <Button variant="destructive" className="rounded-lg" onClick={() => setShowDeleteConfirm(true)}>
              Request Account Deletion
            </Button>
          </CardContent>
        </Card>

      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Request Account Deletion</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to request account deletion? All your data including patients and analyses will be permanently deleted. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-lg" onClick={handleRequestDeletion} disabled={requestingDeletion}>
              {requestingDeletion ? 'Submitting...' : 'Confirm Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailChange} onOpenChange={setShowEmailChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Request Email Change</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Current Email</Label>
              <Input value={form.email} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">New Email</Label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new.email@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Reason (optional)</Label>
              <Textarea rows={3} value={emailChangeReason} onChange={e => setEmailChangeReason(e.target.value)} placeholder="Why are you requesting this change?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setShowEmailChange(false)}>Cancel</Button>
            <Button className="rounded-lg" onClick={handleRequestEmailChange} disabled={submittingEmailChange || !newEmail}>
              {submittingEmailChange ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
