import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiGet, apiPut } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';
import { useAuth } from '@/lib/AuthContext';

export default function PatientProfile() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();

  const [patient, setPatient] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ full_name: '', date_of_birth: '', gender: 'Male', contact_number: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    if (!id) return Promise.resolve();
    setLoading(true);
    setError('');
    return Promise.all([
      apiGet<any>(`/api/patients/${id}`),
      apiGet<any[]>(`/api/analysis/?patient_id=${id}`),
    ])
      .then(([patientData, analysisData]) => {
        setPatient(patientData);
        setAnalyses(analysisData);
      })
      .catch(err => setError(err.message || 'Failed to load patient.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isLoadingAuth || !user) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingAuth, user, id]);

  const openEdit = () => {
    if (!patient) return;
    setForm({
      full_name: patient.full_name || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || 'Male',
      contact_number: patient.contact_number || '',
      notes: patient.notes || '',
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await apiPut<any>(`/api/patients/${id}`, form);
      setPatient(updated);
      setShowEdit(false);
      toast({ title: 'Patient updated', description: `${updated.full_name}'s record was updated.` });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message || 'Could not update patient.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <DoctorTopbar title="Patient Profile" />
        <div className="p-6 flex items-center justify-center h-64">
          <div className="h-6 w-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <DoctorTopbar title="Patient Profile" />
        <div className="p-6 space-y-4">
          <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Patients
          </Link>
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div>
        <DoctorTopbar title="Patient Profile" />
        <div className="p-6 space-y-4">
          <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Patients
          </Link>
          <p className="text-sm text-muted-foreground">Patient not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DoctorTopbar title="Patient Profile" />
      <div className="p-6 space-y-6">
        <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Patients
        </Link>

        <Card className="border border-border rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Full Name</p>
                  <p className="text-sm font-medium mt-0.5">{patient.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Date of Birth</p>
                  <p className="text-sm mt-0.5">{patient.date_of_birth ? format(new Date(patient.date_of_birth), 'dd MMM yyyy') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Gender</p>
                  <p className="text-sm mt-0.5">{patient.gender || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Contact Number</p>
                  <p className="text-sm mt-0.5">{patient.contact_number || '-'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground font-medium">Notes</p>
                  <p className="text-sm mt-0.5">{patient.notes || '-'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-lg gap-2" size="sm" onClick={openEdit}>
                  <Pencil className="h-3.5 w-3.5" /> Edit Patient
                </Button>
                <Link to={`/new-analysis?patient=${patient.id}`}>
                  <Button className="rounded-lg gap-2" size="sm">
                    <Plus className="h-3.5 w-3.5" /> New Analysis
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Analysis History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Image Type</TableHead>
                  <TableHead>Top Prediction</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No analyses yet</TableCell></TableRow>
                ) : analyses.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.created_at ? format(new Date(a.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell className="capitalize">{a.image_type}</TableCell>
                    <TableCell className="font-medium">{a.top_predictions?.[0]?.condition || '-'}</TableCell>
                    <TableCell>{a.top_predictions?.[0] ? `${(a.top_predictions[0].confidence * 100).toFixed(1)}%` : '-'}</TableCell>
                    <TableCell>
                      <Link to={`/history/${a.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
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
            <Button variant="outline" className="rounded-lg" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button className="rounded-lg" onClick={handleSave} disabled={saving || !form.full_name || !form.date_of_birth || !form.contact_number}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
