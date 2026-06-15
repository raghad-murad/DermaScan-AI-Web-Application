import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';
import { Switch } from '@/components/ui/switch';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

export default function DoctorSettings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({ specialty: '', hospital: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        specialty: user.specialty || '',
        hospital: user.hospital || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setSaving(false);
  };

  return (
    <div>
      <DoctorTopbar title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">
        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Name</Label>
              <Input value={user?.full_name || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Name cannot be changed here.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Email</Label>
              <Input value={user?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Specialty</Label>
              <Input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Hospital / Institution</Label>
              <Input value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} />
            </div>
            <Button className="rounded-lg" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}