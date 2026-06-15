import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Zap, Check, CircleDot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';
import { differenceInYears, parseISO } from 'date-fns';

export default function NewAnalysis() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patient');

  const [step, setStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: '', date_of_birth: '', gender: 'Male', phone: '', address: '', medical_notes: '' });
  const [imageType, setImageType] = useState('clinical');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [savingPatient, setSavingPatient] = useState(false);

  const { data: patients } = useQuery({
    queryKey: ['doctor-patients', userId],
    queryFn: () => base44.entities.Patient.filter({ doctor_id: userId }),
    initialData: [],
    enabled: !!userId,
  });

  useEffect(() => {
    if (preselectedPatientId && patients.length > 0) {
      const p = patients.find(pt => pt.id === preselectedPatientId);
      if (p) { setSelectedPatient(p); setStep(2); }
    }
  }, [preselectedPatientId, patients]);

  const filteredPatients = patients.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  const handleSaveNewPatient = async () => {
    setSavingPatient(true);
    const age = newPatient.date_of_birth ? differenceInYears(new Date(), parseISO(newPatient.date_of_birth)) : 0;
    const created = await base44.entities.Patient.create({ ...newPatient, doctor_id: userId, age });
    setSelectedPatient(created);
    setShowNewPatient(false);
    setStep(2);
    queryClient.invalidateQueries({ queryKey: ['doctor-patients'] });
    setSavingPatient(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    let image_url = '';
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = file_url;
    }

    // Simulate AI predictions
    const mockPredictions = [
      { disease: 'Melanoma', icd10: 'C43.9', confidence: 0.785 },
      { disease: 'Basal Cell Carcinoma', icd10: 'C44.91', confidence: 0.152 },
      { disease: 'Actinic Keratosis', icd10: 'L57.0', confidence: 0.063 },
    ];

    const analysis = await base44.entities.Analysis.create({
      doctor_id: userId,
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.full_name,
      image_type: imageType,
      image_url,
      model_used: imageType === 'dermoscopic' ? 'EfficientNet-B3' : 'ResNet101',
      predictions: mockPredictions,
      status: 'ready',
    });

    await base44.entities.Patient.update(selectedPatient.id, {
      last_visit: new Date().toISOString(),
      total_analyses: (selectedPatient.total_analyses || 0) + 1,
    });

    setResults({ ...analysis, predictions: mockPredictions });
    setAnalyzing(false);
    setStep(3);
  };

  const handleConfirm = async () => {
    const diagnosis = confirmation === 'custom' ? customDiagnosis : confirmation;
    await base44.entities.Analysis.update(results.id, { confirmed_diagnosis: diagnosis, doctor_notes: doctorNotes });
    queryClient.invalidateQueries({ queryKey: ['doctor-analyses'] });
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.6) return 'bg-destructive';
    if (conf >= 0.3) return 'bg-yellow-500';
    return 'bg-secondary';
  };

  return (
    <div>
      <DoctorTopbar title="New Analysis" />
      <div className="p-6 max-w-4xl">
        {/* Step 1: Patient Selection */}
        {step === 1 && (
          <Card className="border border-border rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Select Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search patient by name or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && filteredPatients.length > 0 && (
                <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                  {filteredPatients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setStep(2); }}
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm"
                    >
                      <span className="font-medium">{p.full_name}</span>
                      <span className="text-muted-foreground ml-2">{p.age}y, {p.gender}</span>
                    </button>
                  ))}
                </div>
              )}
              {!showNewPatient && (
                <Button variant="outline" className="rounded-lg" onClick={() => setShowNewPatient(true)}>
                  + Add New Patient
                </Button>
              )}
              {showNewPatient && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Full Name</Label>
                      <Input value={newPatient.full_name} onChange={e => setNewPatient({ ...newPatient, full_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Date of Birth</Label>
                      <Input type="date" value={newPatient.date_of_birth} onChange={e => setNewPatient({ ...newPatient, date_of_birth: e.target.value })} required />
                      {newPatient.date_of_birth && (
                        <p className="text-xs text-muted-foreground">Age: {differenceInYears(new Date(), parseISO(newPatient.date_of_birth))} years</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Gender</Label>
                      <Select value={newPatient.gender} onValueChange={v => setNewPatient({ ...newPatient, gender: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Phone</Label>
                      <Input value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} required />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-[13px] font-medium">Address (optional)</Label>
                      <Input value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-[13px] font-medium">Medical Notes (optional)</Label>
                      <Textarea value={newPatient.medical_notes} onChange={e => setNewPatient({ ...newPatient, medical_notes: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="rounded-lg" onClick={handleSaveNewPatient} disabled={savingPatient || !newPatient.full_name || !newPatient.date_of_birth || !newPatient.phone}>
                      {savingPatient ? 'Saving...' : 'Save Patient'}
                    </Button>
                    <Button variant="outline" className="rounded-lg" onClick={() => setShowNewPatient(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload & Analyze */}
        {step >= 2 && (
          <div className="space-y-6">
            {selectedPatient && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <span className="text-sm font-medium">Patient: {selectedPatient.full_name}, {selectedPatient.age}{selectedPatient.gender?.[0]}</span>
                {step === 2 && (
                  <button onClick={() => { setSelectedPatient(null); setStep(1); }} className="text-xs text-primary hover:underline">Change</button>
                )}
              </div>
            )}

            {step === 2 && (
              <Card className="border border-border rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Step 2: Upload Image & Analyze</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-3">
                    {['clinical', 'dermoscopic'].map(t => (
                      <button
                        key={t}
                        onClick={() => setImageType(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                          imageType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {t} Image
                      </button>
                    ))}
                  </div>

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

                  <Button className="w-full rounded-lg h-12 gap-2 text-base" onClick={handleAnalyze} disabled={!imageFile || analyzing}>
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
            )}

            {/* Step 3: Results */}
            {step === 3 && results && (
              <div className="space-y-6">
                {/* Uploaded Image */}
                {imagePreview && (
                  <Card className="border border-border rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg">Analyzed Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img src={imagePreview} alt="Analysis" className="max-h-72 rounded-xl object-contain w-full bg-muted" />
                      <p className="text-xs text-muted-foreground mt-2 capitalize">{imageType} image</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border border-border rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Top Predictions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {results.predictions.map((p, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{p.disease}</span>
                            <Badge variant="outline" className="text-xs">{p.icd10}</Badge>
                          </div>
                          <span className="text-sm font-medium">{(p.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${getConfidenceColor(p.confidence)} rounded-full`} style={{ width: `${p.confidence * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">Model: {results.model_used} | Image: {results.image_type}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Most likely condition</p>
                      <p className="text-xl font-heading font-medium">{results.predictions[0].disease}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Alternative conditions</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {results.predictions.slice(1).map((p, i) => (
                          <Badge key={i} variant="secondary">{p.disease}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Confirm Diagnosis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={confirmation} onValueChange={setConfirmation}>
                      {results.predictions.slice(0, 2).map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <RadioGroupItem value={p.disease} id={`pred-${i}`} />
                          <Label htmlFor={`pred-${i}`} className="text-sm">Confirm AI prediction: {p.disease}</Label>
                        </div>
                      ))}
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="custom" id="pred-custom" />
                        <Label htmlFor="pred-custom" className="text-sm">Different diagnosis:</Label>
                      </div>
                    </RadioGroup>
                    {confirmation === 'custom' && (
                      <Input placeholder="Enter diagnosis" value={customDiagnosis} onChange={e => setCustomDiagnosis(e.target.value)} />
                    )}
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Notes</Label>
                      <Textarea placeholder="Additional notes..." value={doctorNotes} onChange={e => setDoctorNotes(e.target.value)} />
                    </div>
                    <Button className="rounded-lg" onClick={handleConfirm} disabled={!confirmation}>
                      <Check className="h-4 w-4 mr-2" /> Confirm & Save
                    </Button>
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground text-center">
                  This system supports clinical decision-making and does not replace professional medical judgment.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}