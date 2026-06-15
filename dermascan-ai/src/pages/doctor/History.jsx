import React, { useState } from 'react';
import { Search, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';
import { Link, useNavigate } from 'react-router-dom';

export default function History() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [imageTypeFilter, setImageTypeFilter] = useState('all');

  const { data: analyses } = useQuery({
    queryKey: ['doctor-analyses', userId],
    queryFn: () => base44.entities.Analysis.filter({ doctor_id: userId }, '-created_date', 100),
    initialData: [],
    enabled: !!userId,
  });

  const filtered = analyses.filter(a => {
    const matchesSearch = !search || 
      a.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.predictions?.[0]?.disease?.toLowerCase().includes(search.toLowerCase());
    const matchesType = imageTypeFilter === 'all' || a.image_type === imageTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id) => {
    await base44.entities.Analysis.delete(id);
    queryClient.invalidateQueries({ queryKey: ['doctor-analyses'] });
  };

  return (
    <div>
      <DoctorTopbar title="Analysis Archive" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by patient or disease..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
                  <TableHead>ICD-10</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No analyses found</TableCell></TableRow>
                ) : filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{format(new Date(a.created_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="font-medium">{a.patient_name || '-'}</TableCell>
                    <TableCell className="capitalize">{a.image_type}</TableCell>
                    <TableCell>{a.predictions?.[0]?.disease || '-'}</TableCell>
                    <TableCell>{a.predictions?.[0] ? `${(a.predictions[0].confidence * 100).toFixed(1)}%` : '-'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.predictions?.[0]?.icd10 || '-'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to={`/history/${a.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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