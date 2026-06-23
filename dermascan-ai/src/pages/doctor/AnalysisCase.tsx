import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { apiGet, apiPut } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

const getConfidenceColor = (conf: number) => {
  if (conf >= 0.6) return 'bg-destructive';
  if (conf >= 0.3) return 'bg-yellow-500';
  return 'bg-secondary';
};

export default function AnalysisCase() {
  const { id } = useParams();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    apiGet<any>(`/api/analysis/${id}`)
      .then(analysisData => {
        setAnalysis(analysisData);
        setNotes(analysisData.notes || '');
        return apiGet<any>(`/api/patients/${analysisData.patient_id}`);
      })
      .then(patientData => setPatient(patientData))
      .catch(err => setError(err.message || 'Failed to load analysis.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    try {
      const updated = await apiPut<any>(`/api/analysis/${id}`, { notes });
      setAnalysis(updated);
      toast({ title: 'Notes saved', description: 'Your notes for this case have been updated.' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Could not save notes.', variant: 'destructive' });
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div>
        <DoctorTopbar title="Case Details" />
        <div className="p-6 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <DoctorTopbar title="Case Details" />
        <div className="p-6 space-y-4">
          <Link to="/history">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to History
            </Button>
          </Link>
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div>
        <DoctorTopbar title="Case Details" />
        <div className="p-6 space-y-4">
          <Link to="/history">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to History
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">Analysis not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DoctorTopbar title="Case Details" />
      <div className="p-6 max-w-4xl space-y-6">

        <Link to="/history">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to History
          </Button>
        </Link>

        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Case Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Patient</p>
              {patient ? (
                <Link to={`/patients/${patient.id}`} className="font-medium text-primary hover:underline">{patient.full_name}</Link>
              ) : (
                <p className="font-medium">—</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Analysis Date</p>
              <p className="font-medium">{analysis.created_at ? format(new Date(analysis.created_at), 'dd MMM yyyy') : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Image Type</p>
              <p className="font-medium capitalize">{analysis.image_type}</p>
            </div>
          </CardContent>
        </Card>

        {analysis.image_url && (
          <Card className="border border-border rounded-xl">
            <CardHeader><CardTitle className="text-base">Skin Image</CardTitle></CardHeader>
            <CardContent>
              <img
                src={analysis.image_url}
                alt="Case"
                className="max-w-full max-h-80 rounded-xl border border-border object-contain bg-muted"
              />
            </CardContent>
          </Card>
        )}

        <Card className="border border-border rounded-xl">
          <CardHeader><CardTitle className="text-base">AI Predictions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!analysis.top_predictions?.length ? (
              <p className="text-sm text-muted-foreground italic">No predictions available.</p>
            ) : analysis.top_predictions.map((p: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.condition}</span>
                    {p.icd10 && <Badge variant="outline" className="text-xs">{p.icd10}</Badge>}
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

        <Card className="border border-border rounded-xl">
          <CardHeader><CardTitle className="text-base">Doctor Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Add clinical notes for this case..."
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <Button size="sm" className="rounded-lg gap-2" onClick={handleSaveNotes} disabled={savingNotes}>
              <Save className="h-3.5 w-3.5" /> {savingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          This system supports clinical decision-making and does not replace professional medical judgment.
        </p>
      </div>
    </div>
  );
}
