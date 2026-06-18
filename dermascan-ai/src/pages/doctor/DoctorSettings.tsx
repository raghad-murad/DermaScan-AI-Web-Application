import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

const specialtiesList = ['Dermatology', 'General Practice', 'Internal Medicine', 'Oncology', 'Pathology', 'Immunology'];

export default function DoctorSettings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    specialty: '', 
    hospital: '',
    phone: '',
    preferred_username: '',
    license_number: '',
    license_authority: '',
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
        specialty: user.specialty || '',
        hospital: user.hospital || '',
        phone: user.phone || '',
        preferred_username: user.preferred_username?.replace(/^dr\./, '') || '',
        license_number: user.license_number || '',
        license_authority: user.license_authority || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: form.full_name,
        email: form.email,
        specialty: form.specialty, 
        hospital: form.hospital,
        phone: form.phone,
        preferred_username: `dr.${form.preferred_username}`,
      });
    } catch (err) {
      console.error(err);
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

  return (
    <div>
      <DoctorTopbar title="Settings" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        
        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Profile & Professional Information</CardTitle>
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
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="border-black focus-visible:ring-black dark:border-white" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-primary">Username</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-lg border border-black dark:border-white">dr.</span>
                  <Input 
                    value={form.preferred_username} 
                    onChange={e => setForm({ ...form, preferred_username: e.target.value })} 
                    className="border-black focus-visible:ring-black dark:border-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-primary">Phone Number</Label>
                <Input 
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value })} 
                  className="border-black focus-visible:ring-black dark:border-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-primary">Medical Specialty</Label>
                <Input 
                  list="specialties-options"
                  placeholder="Select or type your specialty..."
                  value={form.specialty} 
                  onChange={e => setForm({ ...form, specialty: e.target.value })} 
                  className="border-black focus-visible:ring-black dark:border-white"
                  required
                />
                <datalist id="specialties-options">
                  {specialtiesList.map(s => <option key={s} value={s} />)}
                </datalist>
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
                  disabled 
                  className="bg-muted border-black/40 text-muted-foreground cursor-not-allowed" 
                />
                <p className="text-[11px] text-muted-foreground">Verified credentials cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-primary">License Issuing Authority</Label>
                <Input 
                  value={form.license_authority} 
                  disabled 
                  className="bg-muted border-black/40 text-muted-foreground cursor-not-allowed" 
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
    </div>
  );
}