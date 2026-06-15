import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, FileText, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

export default function PatientProfile() {
  const { id } = useParams();

  const { data: patient } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const patients = await base44.entities.Patient.filter({ id });
      return patients[0];
    },
    enabled: !!id,
  });

  const { data: analyses } = useQuery({
    queryKey: ['patient-analyses', id],
    queryFn: () => base44.entities.Analysis.filter({ patient_id: id }, '-created_date'),
    initialData: [],
    enabled: !!id,
  });

  if (!patient) {
    return (
      <div>
        <DoctorTopbar title="Patient Profile" />
        <div className="p-6 flex items-center justify-center h-64">
          <div className="h-6 w-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
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
                  <p className="text-xs text-muted-foreground font-medium">Age / Gender</p>
                  <p className="text-sm mt-0.5">{patient.age} years, {patient.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Phone</p>
                  <p className="text-sm mt-0.5">{patient.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Address</p>
                  <p className="text-sm mt-0.5">{patient.address || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Medical Notes</p>
                  <p className="text-sm mt-0.5">{patient.medical_notes || '-'}</p>
                </div>
              </div>
              <div className="flex gap-2">
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
                  <TableHead>ICD-10</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No analyses yet</TableCell></TableRow>
                ) : analyses.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{format(new Date(a.created_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="capitalize">{a.image_type}</TableCell>
                    <TableCell className="font-medium">{a.predictions?.[0]?.disease || '-'}</TableCell>
                    <TableCell>{a.predictions?.[0] ? `${(a.predictions[0].confidence * 100).toFixed(1)}%` : '-'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.predictions?.[0]?.icd10 || '-'}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={a.status === 'ready' ? 'bg-secondary/10 text-secondary' : 'bg-yellow-500/10 text-yellow-600'}>
                        {a.status === 'ready' ? 'Ready' : 'Processing'}
                      </Badge>
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