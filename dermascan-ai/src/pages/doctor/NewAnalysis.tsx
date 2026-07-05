import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Zap, UserPlus, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiGet, apiPost, apiPostForm, apiPut } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';
import { useAuth } from '@/lib/AuthContext';

const emptyPatientForm = { full_name: '', date_of_birth: '', gender: '', contact_number: '', notes: '' };

export default function NewAnalysis() {
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patient');

  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [imageType, setImageType] = useState('clinical');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [results, setResults] = useState<any>(null);

  const [caseNotes, setCaseNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [showNewPatient, setShowNewPatient] = useState(false);
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [creatingPatient, setCreatingPatient] = useState(false);

  const fetchPatients = () => {
    setLoadingPatients(true);
    return apiGet<any[]>('/api/patients/')
      .then(data => {
        setPatients(data);
        return data;
      })
      .catch(err => { setPatientsError(err.message || 'Failed to load patients.'); return []; })
      .finally(() => setLoadingPatients(false));
  };

  useEffect(() => {
    if (isLoadingAuth || !user) return;
    fetchPatients().then(data => {
      if (preselectedPatientId && data.some((p: any) => p.id === preselectedPatientId)) {
        setSelectedPatientId(preselectedPatientId);
      }
    });
  }, [isLoadingAuth, user, preselectedPatientId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveNotes = async () => {
    if (!results?.id) return;
    setSavingNotes(true);
    try {
      await apiPut(`/api/analysis/${results.id}`, { notes: caseNotes });
      toast({ title: 'Notes saved successfully' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Could not save notes.', variant: 'destructive' });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedPatientId || !imageFile) return;
    setAnalyzing(true);
    setAnalyzeError('');
    setResults(null);
    setCaseNotes('');
    try {
      const formData = new FormData();
      formData.append('patient_id', selectedPatientId);
      formData.append('image_type', imageType);
      formData.append('file', imageFile);
      const analysis = await apiPostForm<any>('/api/analysis/', formData);
      setResults(analysis);
      toast({ title: 'Analysis complete', description: 'AI predictions are ready below.' });
    } catch (err: any) {
      setAnalyzeError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreatePatient = async () => {
    setCreatingPatient(true);
    try {
      const newPatient = await apiPost<any>('/api/patients', {
        full_name: patientForm.full_name,
        date_of_birth: patientForm.date_of_birth,
        gender: patientForm.gender,
        contact_number: patientForm.contact_number || undefined,
        notes: patientForm.notes || undefined,
      });
      const refreshed = await fetchPatients();
      const created = refreshed.find((p: any) => p.id === newPatient.id) ?? newPatient;
      setSelectedPatientId(created.id);
      toast({ title: 'Patient created successfully' });
      setShowNewPatient(false);
      setPatientForm(emptyPatientForm);
    } catch (err: any) {
      toast({ title: 'Failed to create patient', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleCancelNewPatient = () => {
    setShowNewPatient(false);
    setPatientForm(emptyPatientForm);
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.6) return 'bg-destructive';
    if (conf >= 0.3) return 'bg-yellow-500';
    return 'bg-secondary';
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const newPatientValid = patientForm.full_name && patientForm.date_of_birth && patientForm.gender;

  return (
    <div>
      <DoctorTopbar title="New Analysis" />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">New Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Patient</Label>
              {loadingPatients ? (
                <p className="text-sm text-muted-foreground">Loading patients...</p>
              ) : patientsError ? (
                <p className="text-sm text-destructive">{patientsError}</p>
              ) : (
                <div className="flex gap-2">
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={patients.length === 0 ? 'No patients yet — add one first' : 'Select a patient...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg gap-1.5 shrink-0"
                    onClick={() => setShowNewPatient(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    New Patient
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Image Type</Label>
              <div className="flex gap-3">
                {['clinical', 'dermoscopic'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setImageType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                      imageType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t} Image
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Image</Label>
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                  <span className="text-sm text-muted-foreground">Click to upload or drag & drop</span>
                  <span className="text-xs text-muted-foreground mt-1">JPG, PNG, TIFF - Max 10MB</span>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.tiff" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Upload preview" className="h-48 rounded-xl object-cover" />
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                    Change image
                  </Button>
                </div>
              )}
            </div>

            {analyzeError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{analyzeError}</div>
            )}

            <Button
              className="w-full rounded-lg h-12 gap-2 text-base"
              onClick={handleAnalyze}
              disabled={!imageFile || !selectedPatientId || analyzing}
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Start AI Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <div className="space-y-6">
            {imagePreview && (
              <Card className="border border-border rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Analyzed Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <img src={imagePreview} alt="Analysis" className="max-h-72 rounded-xl object-contain w-full bg-muted" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedPatient?.full_name} &middot; <span className="capitalize">{results.image_type}</span> image
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border border-border rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Top Predictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.top_predictions.map((p: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{p.condition}</span>
                        {p.icd10 && <Badge variant="outline" className="text-xs">{p.icd10}</Badge>}
                      </div>
                      <span className="text-sm font-medium">{(p.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${getConfidenceColor(p.confidence)} rounded-full`} style={{ width: `${p.confidence * 100}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Clinical Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add your clinical observations..."
                  rows={4}
                  value={caseNotes}
                  onChange={e => setCaseNotes(e.target.value)}
                />
                <Button
                  size="sm"
                  className="rounded-lg gap-2"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              This system supports clinical decision-making and does not replace professional medical judgment.
            </p>
          </div>
        )}
      </div>

      {/* New Patient Dialog */}
      <Dialog open={showNewPatient} onOpenChange={(open) => { if (!open) handleCancelNewPatient(); }}>
        <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={patientForm.full_name}
                onChange={e => setPatientForm({ ...patientForm, full_name: e.target.value })}
                placeholder="Patient's full name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Date of Birth <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={patientForm.date_of_birth}
                onChange={e => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Gender <span className="text-destructive">*</span></Label>
              <Select value={patientForm.gender} onValueChange={v => setPatientForm({ ...patientForm, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select gender..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Contact Number</Label>
              <Input
                value={patientForm.contact_number}
                onChange={e => setPatientForm({ ...patientForm, contact_number: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Notes</Label>
              <Textarea
                value={patientForm.notes}
                onChange={e => setPatientForm({ ...patientForm, notes: e.target.value })}
                placeholder="Optional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={handleCancelNewPatient}>
              Cancel
            </Button>
            <Button
              className="rounded-lg"
              onClick={handleCreatePatient}
              disabled={creatingPatient || !newPatientValid}
            >
              {creatingPatient ? 'Creating...' : 'Create Patient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
