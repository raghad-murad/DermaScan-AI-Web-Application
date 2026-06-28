import React, { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet } from '@/lib/apiClient';
import { format } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function History() {
  const { user, isLoadingAuth } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [imageTypeFilter, setImageTypeFilter] = useState('all');

  useEffect(() => {
    if (isLoadingAuth || !user) return;
    setLoading(true);
    setError('');
    Promise.all([
      apiGet<any[]>('/api/analysis/'),
      apiGet<any[]>('/api/patients/'),
    ])
      .then(([analysisData, patientData]) => {
        setAnalyses(analysisData);
        const map: Record<string, string> = {};
        patientData.forEach(p => { map[p.id] = p.full_name; });
        setPatientNames(map);
      })
      .catch(err => setError(err.message || 'Failed to load analysis history.'))
      .finally(() => setLoading(false));
  }, [isLoadingAuth, user]);

  const filtered = analyses.filter(a => {
    const patientName = patientNames[a.patient_id] || '';
    const topCondition = a.top_predictions?.[0]?.condition || '';
    const matchesSearch = !search ||
      patientName.toLowerCase().includes(search.toLowerCase()) ||
      topCondition.toLowerCase().includes(search.toLowerCase());
    const matchesType = imageTypeFilter === 'all' || a.image_type === imageTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <DoctorTopbar title="Analysis Archive" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by patient or condition..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={imageTypeFilter} onValueChange={setImageTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Image type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="clinical">Clinical</SelectItem>
              <SelectItem value="dermoscopic">Dermoscopic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border border-border rounded-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Image Type</TableHead>
                  <TableHead>Top Prediction</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Loading analyses...</TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-destructive">{error}</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No analyses found</TableCell></TableRow>
                ) : filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.created_at ? format(new Date(a.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell className="font-medium">{patientNames[a.patient_id] || '-'}</TableCell>
                    <TableCell className="capitalize">{a.image_type}</TableCell>
                    <TableCell>{a.top_predictions?.[0]?.condition || '-'}</TableCell>
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
    </div>
  );
}
