import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, FileText, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';
import { useAuth } from '@/lib/AuthContext';

const emptyMed = { medication: '', dose: '', duration: '' };

const getConfidenceColor = (conf) => {
  if (conf >= 0.6) return 'bg-destructive';
  if (conf >= 0.3) return 'bg-yellow-500';
  return 'bg-secondary';
};

export default function AnalysisCase() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => base44.entities.Analysis.filter({ doctor_id: user?.id }).then(list => list.find(a => a.id === id)),
    enabled: !!id && !!user?.id,
  });

  const [form, setForm] = useState(null);

  React.useEffect(() => {
    if (analysis && !form) {
      setForm({
        confirmed_diagnosis: analysis.confirmed_diagnosis || '',
        doctor_notes: analysis.doctor_notes || '',
        prescription: analysis.prescription?.length ? analysis.prescription : [],
        prescription_instructions: analysis.prescription_instructions || '',
        next_appointment: analysis.next_appointment || '',
      });
    }
  }, [analysis]);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Analysis.update(id, form);
    queryClient.invalidateQueries({ queryKey: ['analysis', id] });
    queryClient.invalidateQueries({ queryKey: ['doctor-analyses'] });
    setEditing(false);
    setSaving(false);
  };

  const addMedication = () => setForm(f => ({ ...f, prescription: [...(f.prescription || []), { ...emptyMed }] }));
  const removeMedication = (i) => setForm(f => ({ ...f, prescription: f.prescription.filter((_, idx) => idx !== i) }));
  const updateMed = (i, field, val) => setForm(f => ({
    ...f,
    prescription: f.prescription.map((m, idx) => idx === i ? { ...m, [field]: val } : m)
  }));

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !analysis) {
    return (
      <div>
        <DoctorTopbar title="Case Details" />
        <div className="p-6 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const data = editing ? form : analysis;

  return (
    <div>
      <DoctorTopbar title="Case Details" />
      <div className="p-6 max-w-4xl space-y-6 print:p-0">

        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <Link to="/history">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Archive
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print Report
            </Button>
            {!editing ? (
              <Button size="sm" className="gap-2" onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4" /> Edit Case
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { setEditing(false); setForm({ confirmed_diagnosis: analysis.confirmed_diagnosis || '', doctor_notes: analysis.doctor_notes || '', prescription: analysis.prescription || [], prescription_instructions: analysis.prescription_instructions || '', next_appointment: analysis.next_appointment || '' }); }}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">DermAIPro — Clinical Report</h1>
          <p className="text-sm text-gray-500">Generated: {format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
        </div>

        {/* Patient & Date Info */}
        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Case Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Patient</p>
              <p className="font-medium">{analysis.patient_name || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Analysis Date</p>
              <p className="font-medium">{format(new Date(analysis.created_date), 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Image Type</p>
              <p className="font-medium capitalize">{analysis.image_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">{analysis.model_used || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={analysis.status === 'ready' ? 'default' : 'secondary'} className="capitalize">{analysis.status}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Image */}
        {analysis.image_url && (
          <Card className="border border-border rounded-xl">
            <CardHeader><CardTitle className="text-base">Skin Image</CardTitle></CardHeader>
            <CardContent>
              <img src={analysis.image_url} alt="Case" className="max-h-80 rounded-xl object-contain w-full bg-muted" />
            </CardContent>
          </Card>
        )}

        {/* AI Predictions */}
        {analysis.predictions?.length > 0 && (
          <Card className="border border-border rounded-xl">
            <CardHeader><CardTitle className="text-base">AI Predictions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {analysis.predictions.map((p, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{p.disease}</span>
                      <Badge variant="outline" className="text-xs">{p.icd10}</Badge>
                    </div>
                    <span className="text-sm font-medium">{(p.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${getConfidenceColor(p.confidence)} rounded-full`} style={{ width: `${p.confidence * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Diagnosis & Notes */}
        <Card className="border border-border rounded-xl">
          <CardHeader><CardTitle className="text-base">Doctor's Diagnosis & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Confirmed Diagnosis</Label>
              {editing ? (
                <Input value={form.confirmed_diagnosis} onChange={e => setForm(f => ({ ...f, confirmed_diagnosis: e.target.value }))} />
              ) : (
                <p className="text-sm font-medium">{analysis.confirmed_diagnosis || <span className="text-muted-foreground italic">Not confirmed yet</span>}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Clinical Notes</Label>
              {editing ? (
                <Textarea value={form.doctor_notes} onChange={e => setForm(f => ({ ...f, doctor_notes: e.target.value }))} rows={3} />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{analysis.doctor_notes || <span className="text-muted-foreground italic">No notes</span>}</p>
              )}
            </div>
            {editing && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">Next Appointment</Label>
                <Input type="date" value={form.next_appointment} onChange={e => setForm(f => ({ ...f, next_appointment: e.target.value }))} />
              </div>
            )}
            {!editing && analysis.next_appointment && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">Next Appointment</Label>
                <p className="text-sm font-medium">{format(new Date(analysis.next_appointment), 'dd MMM yyyy')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prescription (وصفة علاجية) */}
        <Card className="border border-border rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Prescription (وصفة علاجية)
            </CardTitle>
            {editing && (
              <Button variant="outline" size="sm" className="gap-1" onClick={addMedication}>
                <Plus className="h-3.5 w-3.5" /> Add Medication
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {(editing ? form.prescription : analysis.prescription)?.length === 0 || !(editing ? form.prescription : analysis.prescription)?.length ? (
              <p className="text-sm text-muted-foreground italic">{editing ? 'Click "Add Medication" to add medications.' : 'No prescription added.'}</p>
            ) : (
              <div className="space-y-3">
                {(editing ? form.prescription : analysis.prescription).map((med, i) => (
                  <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg relative">
                    {editing ? (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Medication</Label>
                          <Input value={med.medication} onChange={e => updateMed(i, 'medication', e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dose</Label>
                          <Input value={med.dose} onChange={e => updateMed(i, 'dose', e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration</Label>
                          <div className="flex gap-1">
                            <Input value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)} className="h-8 text-sm" />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeMedication(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Medication</p>
                          <p className="text-sm font-medium">{med.medication}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Dose</p>
                          <p className="text-sm font-medium">{med.dose}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="text-sm font-medium">{med.duration}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[13px]">Instructions / تعليمات</Label>
              {editing ? (
                <Textarea value={form.prescription_instructions} onChange={e => setForm(f => ({ ...f, prescription_instructions: e.target.value }))} rows={2} placeholder="e.g. Apply twice daily, avoid sun exposure..." />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{analysis.prescription_instructions || <span className="text-muted-foreground italic">No instructions</span>}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center print:hidden">
          This system supports clinical decision-making and does not replace professional medical judgment.
        </p>
      </div>
    </div>
  );
}