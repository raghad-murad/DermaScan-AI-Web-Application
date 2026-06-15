import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import AppLogo from '@/components/AppLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { base44 } from '@/api/base44Client';

const specialties = ['Dermatology', 'General Practice', 'Internal Medicine', 'Oncology', 'Pathology', 'Immunology', 'Other'];

export default function RequestAccount() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', specialty: '', hospital: '',
    license_number: '', license_authority: '', preferred_username: '',
    password: '', confirm_password: '',
  });
  const [docFile, setDocFile] = useState(null);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) return;
    setLoading(true);
    let document_url = '';
    if (docFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: docFile });
      document_url = file_url;
    }
    await base44.entities.AccountRequest.create({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      specialty: form.specialty,
      hospital: form.hospital,
      license_number: form.license_number,
      license_authority: form.license_authority,
      document_url,
      preferred_username: `dr.${form.preferred_username}`,
      status: 'pending',
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border border-border rounded-xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-heading font-medium">Request submitted successfully, Doctor!</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your request is now under review by our medical platform administration team to ensure the security and privacy of all cases. 
              You will receive an email notification with your account activation within 24-48 hours.
            </p>
            <Link to="/login">
              <Button variant="outline" className="rounded-lg mt-4">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl font-heading font-medium mb-2">Request a Doctor Account</h1>
          <p className="text-muted-foreground">Your request will be manually reviewed by our admin team to verify your medical credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1 */}
          <div className="space-y-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Basic Personal Info</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[13px] font-medium">Full Name</Label>
                <Input placeholder="As registered with your medical association" value={form.full_name} onChange={e => updateField('full_name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Email Address</Label>
                <Input type="email" placeholder="your.email@example.com" value={form.email} onChange={e => updateField('email', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Phone Number</Label>
                <Input placeholder="+970-59-XXXXXXX" value={form.phone} onChange={e => updateField('phone', e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Professional Info</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Medical Specialty</Label>
                <Select value={form.specialty} onValueChange={v => updateField('specialty', v)}>
                  <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent>
                    {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Hospital / Institution</Label>
                <Input placeholder="Current workplace" value={form.hospital} onChange={e => updateField('hospital', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Medical License Number</Label>
                <Input placeholder="PMC-2024-XXXX" value={form.license_number} onChange={e => updateField('license_number', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">License Issuing Authority</Label>
                <Input placeholder="e.g. Palestinian Medical Council" value={form.license_authority} onChange={e => updateField('license_authority', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Verification Documents</h3>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Upload License or Medical ID</Label>
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {docFile ? docFile.name : 'Click to upload (PDF or image)'}
                </span>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDocFile(e.target.files[0])} />
              </label>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account Preferences</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[13px] font-medium">Preferred Username</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-lg">dr.</span>
                  <Input placeholder="username" value={form.preferred_username} onChange={e => updateField('preferred_username', e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Password</Label>
                <Input type="password" value={form.password} onChange={e => updateField('password', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Confirm Password</Label>
                <Input type="password" value={form.confirm_password} onChange={e => updateField('confirm_password', e.target.value)} required />
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-lg h-12 text-base" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Join Request'}
          </Button>
        </form>
      </div>
    </div>
  );
}