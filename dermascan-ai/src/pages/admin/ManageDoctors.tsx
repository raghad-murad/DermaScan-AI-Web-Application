import React, { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const specialtiesList = ['Dermatology', 'General Practice', 'Internal Medicine', 'Oncology', 'Pathology', 'Immunology'];

export default function ManageDoctors() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPanel, setShowPanel] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({ 
    full_name: '', 
    email: '', 
    phone: '',
    specialty: '', 
    hospital: '', 
    license_number: '',
    license_authority: '',
    username: '',
    password: '' 
  });

  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: analyses } = useQuery({
    queryKey: ['all-analyses'],
    queryFn: () => base44.entities.Analysis.list('-created_date', 1000),
    initialData: [],
  });

  const doctors = users.filter(u => u.role === 'user');

  const getCaseCount = (doctorId) => analyses.filter(a => a.doctor_id === doctorId).length;

  const handleAddDoctor = async () => {
    await (base44 as any).users.inviteUser(form.email, 'user', form.password);
    
    await base44.entities.AuditLog.create({
      actor_id: user?.id, 
      actor_name: user?.full_name, 
      actor_role: 'admin',
      action: 'Added new doctor manually', 
      target: form.full_name,
    });
    
    queryClient.invalidateQueries({ queryKey: ['all-users'] });
    setShowPanel(false);
    setForm({ 
      full_name: '', 
      email: '', 
      phone: '',
      specialty: '', 
      hospital: '', 
      license_number: '',
      license_authority: '',
      username: '',
      password: '' 
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-medium">Manage Doctors</h1>
        <Button className="rounded-lg gap-2" onClick={() => setShowPanel(true)}>
          <Plus className="h-4 w-4" /> Add Doctor Manually
        </Button>
      </div>

      <Card className="border border-border rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Cases</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No doctors found</TableCell></TableRow>
              ) : doctors.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.full_name}</TableCell>
                  <TableCell>{d.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary">Doctor</Badge>
                  </TableCell>
                  <TableCell>{getCaseCount(d.id)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border border-border rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Add Doctor Manually</DialogTitle>
          </DialogHeader>
          
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-[13px] font-bold text-primary">Full Name</Label>
              <Input placeholder="Doctor's full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Email Address</Label>
              <Input type="email" placeholder="doctor@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Phone Number</Label>
              <Input placeholder="+970-5X-XXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Medical Specialty</Label>
              <Input 
                list="admin-specialties-options"
                placeholder="Select or type specialty..." 
                value={form.specialty} 
                onChange={e => setForm({ ...form, specialty: e.target.value })} 
              />
              <datalist id="admin-specialties-options">
                {specialtiesList.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Hospital / Institution</Label>
              <Input placeholder="Current workplace" value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Medical License Number</Label>
              <Input placeholder="e.g. PMA-XXXXX" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">License Issuing Authority</Label>
              <Select 
                value={form.license_authority} 
                onValueChange={value => setForm({ ...form, license_authority: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select issuing authority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ministry of Health (MoH)">
                    Ministry of Health (MoH) - وزارة الصحة الفلسطينية
                  </SelectItem>
                  <SelectItem value="Palestinian Medical Association (PMA)">
                    Palestinian Medical Association (PMA) - نقابة الأطباء الفلسطينية
                  </SelectItem>
                  <SelectItem value="Palestinian Medical Council (PMC)">
                    Palestinian Medical Council (PMC) - المجلس الطبي الفلسطيني (البورد)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-[13px] font-bold text-primary">Username</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-lg border border-border">dr.</span>
                <Input placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-[13px] font-bold text-primary">Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Temporary password" 
                  value={form.password} 
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

          </div>

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-lg" onClick={() => setShowPanel(false)}>Cancel</Button>
            <Button className="rounded-lg" onClick={handleAddDoctor} disabled={!form.email || !form.full_name || !form.password}>
              Create & Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}