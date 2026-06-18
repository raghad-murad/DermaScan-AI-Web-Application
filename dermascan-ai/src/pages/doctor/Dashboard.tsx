import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

export default function Dashboard() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: analyses } = useQuery({
    queryKey: ['doctor-analyses', userId],
    queryFn: () => base44.entities.Analysis.filter({ doctor_id: userId }, '-created_date', 50),
    initialData: [],
    enabled: !!userId,
  });

  const { data: patients } = useQuery({
    queryKey: ['doctor-patients', userId],
    queryFn: () => base44.entities.Patient.filter({ doctor_id: userId }),
    initialData: [],
    enabled: !!userId,
  });

  const recentCases = analyses.slice(0, 4);

  return (
    <div>
      <DoctorTopbar title="Overview" />
      <div className="p-6 space-y-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="border border-border rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Cases</p>
                  <p className="text-3xl font-heading font-medium mt-1">{analyses.length}</p>
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
                  <p className="text-3xl font-heading font-medium mt-1">{patients.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Cases */}
        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Recent Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCases.length === 0 ? (
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
                    <TableHead>Exam Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCases.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.patient_name || 'Unknown'}</TableCell>
                      <TableCell className="capitalize">{c.image_type}</TableCell>
                      <TableCell>{format(new Date(c.created_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={c.status === 'ready' ? 'bg-secondary/10 text-secondary' : 'bg-yellow-500/10 text-yellow-600'}>
                          {c.status === 'ready' ? 'Ready' : 'Processing'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/patients/${c.patient_id}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5 text-primary">
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
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