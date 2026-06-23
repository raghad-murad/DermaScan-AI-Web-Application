import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { differenceInYears, parseISO } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

const emptyForm = { full_name: '', date_of_birth: '', gender: 'Male', contact_number: '', notes: '' };

export default function Patients() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPatients = () => {
    setLoading(true);
    setError('');
    return apiGet<any[]>('/api/patients/')
      .then(data => setPatients(data))
      .catch(err => setError(err.message || 'Failed to load patients.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.contact_number?.includes(search)
  );

  const getAge = (dob: string) => dob ? differenceInYears(new Date(), parseISO(dob)) : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingPatient) {
        await apiPut(`/api/patients/${editingPatient.id}`, form);
        toast({ title: 'Patient updated', description: `${form.full_name}'s record was updated.` });
      } else {
        await apiPost('/api/patients/', form);
        toast({ title: 'Patient added', description: `${form.full_name} was added to your patient list.` });
      }
      await fetchPatients();
      setShowAdd(false);
      setEditingPatient(null);
      setForm(emptyForm);
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Could not save patient.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: any) => {
    setEditingPatient(p);
    setForm({ full_name: p.full_name || '', date_of_birth: p.date_of_birth || '', gender: p.gender || 'Male', contact_number: p.contact_number || '', notes: p.notes || '' });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/patients/${id}`);
      await fetchPatients();
      toast({ title: 'Patient removed' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message || 'Could not remove patient.', variant: 'destructive' });
    }
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
          <Button className="rounded-lg gap-2" onClick={() => { setEditingPatient(null); setForm(emptyForm); setShowAdd(true); }}>
            <Plus className="h-4 w-4" /> New Patient
          </Button>
        </div>

        <Card className="border border-border rounded-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Loading patients...</TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-destructive">{error}</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No patients found</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link to={`/patients/${p.id}`} className="hover:underline">{p.full_name}</Link>
                    </TableCell>
                    <TableCell>{p.date_of_birth || '-'}</TableCell>
                    <TableCell>{getAge(p.date_of_birth) ?? '-'}</TableCell>
                    <TableCell>{p.gender || '-'}</TableCell>
                    <TableCell>{p.contact_number || '-'}</TableCell>
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPatient ? 'Edit Patient' : 'New Patient'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Full Name</Label>
                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label className="text-[13px] font-medium">Contact Number</Label>
                <Input value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-lg" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="rounded-lg" onClick={handleSave} disabled={saving || !form.full_name || !form.date_of_birth || !form.contact_number}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
