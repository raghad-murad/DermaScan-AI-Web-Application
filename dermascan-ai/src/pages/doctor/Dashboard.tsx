import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiGet } from '@/lib/apiClient';
import { format } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

export default function Dashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      apiGet<any[]>('/api/patients/'),
      apiGet<any[]>('/api/analysis/'),
    ])
      .then(([patientData, analysisData]) => {
        setPatients(patientData);
        setAnalyses(analysisData);
        const map: Record<string, string> = {};
        patientData.forEach(p => { map[p.id] = p.full_name; });
        setPatientNames(map);
      })
      .catch(err => setError(err.message || 'Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const recentCases = [...analyses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div>
      <DoctorTopbar title="Overview" />
      <div className="p-6 space-y-8">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="border border-border rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Analyses</p>
                  <p className="text-3xl font-heading font-medium mt-1">{loading ? '-' : analyses.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Patients</p>
                  <p className="text-3xl font-heading font-medium mt-1">{loading ? '-' : patients.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analyses */}
        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading recent activity...</div>
            ) : recentCases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No analyses yet. Start your first case.</p>
                <Link to="/new-analysis">
                  <Button className="mt-4 rounded-lg" size="sm">New Analysis</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Image Type</TableHead>
                    <TableHead>Top Prediction</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCases.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{patientNames[c.patient_id] || 'Unknown'}</TableCell>
                      <TableCell className="capitalize">{c.image_type}</TableCell>
                      <TableCell>{c.top_predictions?.[0]?.condition || '-'}</TableCell>
                      <TableCell>{c.created_at ? format(new Date(c.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                      <TableCell>
                        <Link to={`/history/${c.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
