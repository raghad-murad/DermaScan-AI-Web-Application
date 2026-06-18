import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, differenceInYears, parseISO } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

export default function Patients() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form, setForm] = useState({ full_name: '', date_of_birth: '', gender: 'Male', phone: '', address: '', medical_notes: '' });

  const { data: patients } = useQuery({
    queryKey: ['doctor-patients', userId],
    queryFn: () => base44.entities.Patient.filter({ doctor_id: userId }),
    initialData: [],
    enabled: !!userId,
  });

  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  );

  const handleSave = async () => {
    const age = form.date_of_birth ? differenceInYears(new Date(), parseISO(form.date_of_birth)) : 0;
    if (editingPatient) {
      await base44.entities.Patient.update(editingPatient.id, { ...form, age });
    } else {
      await base44.entities.Patient.create({ ...form, doctor_id: userId, age });
    }
    queryClient.invalidateQueries({ queryKey: ['doctor-patients'] });
    setShowAdd(false);
    setEditingPatient(null);
    setForm({ full_name: '', date_of_birth: '', gender: 'Male', phone: '', address: '', medical_notes: '' });
  };

  const handleEdit = (p) => {
    setEditingPatient(p);
    setForm({ full_name: p.full_name, date_of_birth: p.date_of_birth, gender: p.gender, phone: p.phone, address: p.address || '', medical_notes: p.medical_notes || '' });
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.Patient.delete(id);
    queryClient.invalidateQueries({ queryKey: ['doctor-patients'] });
  };

  return (
    <div>
      <DoctorTopbar title="Patients" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button className="rounded-lg gap-2" onClick={() => { setEditingPatient(null); setForm({ full_name: '', date_of_birth: '', gender: 'Male', phone: '', address: '', medical_notes: '' }); setShowAdd(true); }}>
            <Plus className="h-4 w-4" /> Add New Patient
          </Button>
        </div>

        <Card className="border border-border rounded-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Analyses</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No patients found</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{p.age}</TableCell>
                    <TableCell>{p.gender}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell>{p.last_visit ? format(new Date(p.last_visit), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell>{p.total_analyses || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to={`/patients/${p.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Full Name</Label>
                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">Date of Birth</Label>
                  <Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Address</Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Medical Notes</Label>
                <Textarea value={form.medical_notes} onChange={e => setForm({ ...form, medical_notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-lg" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="rounded-lg" onClick={handleSave} disabled={!form.full_name || !form.date_of_birth || !form.phone}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}