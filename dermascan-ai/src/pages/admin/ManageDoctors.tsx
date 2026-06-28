import React, { useState, useEffect } from 'react';
import { UserX, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiGet, apiPut } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

export default function ManageDoctors() {
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchDoctors = () => {
    setLoading(true);
    setError('');
    return apiGet<any[]>('/api/users/?role=doctor')
      .then(data => setDoctors(data))
      .catch(err => setError(err.message || 'Failed to load doctors.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isLoadingAuth || !user) return;
    fetchDoctors();
  }, [isLoadingAuth, user]);

  const handleDeactivate = async (doctor: any) => {
    setDeactivatingId(doctor.id);
    try {
      await apiPut(`/api/users/${doctor.id}/deactivate`);
      await fetchDoctors();
      toast({ title: 'Doctor deactivated', description: `${doctor.full_name} can no longer sign in.` });
    } catch (err: any) {
      toast({ title: 'Deactivation failed', description: err.message || 'Could not deactivate doctor.', variant: 'destructive' });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading font-medium">Manage Doctors</h1>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0" />
        Doctors are added by approving account requests.
      </div>

      <Card className="border border-border rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading doctors...</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-destructive">{error}</TableCell></TableRow>
              ) : doctors.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No doctors found</TableCell></TableRow>
              ) : doctors.map(d => {
                const isActive = d.is_active !== false;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.full_name || '-'}</TableCell>
                    <TableCell>{d.email || '-'}</TableCell>
                    <TableCell>{d.specialty || '-'}</TableCell>
                    <TableCell>{d.phonenumber || '-'}</TableCell>
                    <TableCell>{d.username || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={isActive ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        disabled={!isActive || deactivatingId === d.id}
                        onClick={() => handleDeactivate(d)}
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
