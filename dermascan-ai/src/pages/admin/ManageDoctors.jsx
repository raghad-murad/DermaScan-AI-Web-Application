import React, { useState } from 'react';
import { Plus, Pencil, UserX, UserCheck, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function ManageDoctors() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPanel, setShowPanel] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', specialty: '', hospital: '', username: '' });

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
    await base44.users.inviteUser(form.email, 'user');
    await base44.entities.AuditLog.create({
      actor_id: user?.id, actor_name: user?.full_name, actor_role: 'admin',
      action: 'Added new doctor manually', target: form.full_name,
    });
    queryClient.invalidateQueries({ queryKey: ['all-users'] });
    setShowPanel(false);
    setForm({ full_name: '', email: '', specialty: '', hospital: '', username: '' });
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

      <Sheet open={showPanel} onOpenChange={setShowPanel}>
        <SheetContent>
          <SheetHeader><SheetTitle>Add Doctor Manually</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Specialty</Label>
              <Select value={form.specialty} onValueChange={v => setForm({ ...form, specialty: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['Dermatology', 'General Practice', 'Internal Medicine', 'Oncology', 'Pathology', 'Immunology', 'Other'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Hospital / Institution</Label>
              <Input value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Preferred Username</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-lg">dr.</span>
                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" className="rounded-lg" onClick={() => setShowPanel(false)}>Cancel</Button>
            <Button className="rounded-lg" onClick={handleAddDoctor} disabled={!form.email}>Create & Send Invitation</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}