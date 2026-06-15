import React, { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 200),
    initialData: [],
  });

  const filtered = logs.filter(l => {
    const matchSearch = !search || 
      l.actor_name?.toLowerCase().includes(search.toLowerCase()) || 
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.target?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || l.actor_role === roleFilter;
    return matchSearch && matchRole;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Target'];
    const rows = filtered.map(l => [
      format(new Date(l.created_date), 'yyyy-MM-dd HH:mm:ss'),
      l.actor_name, l.actor_role, l.action, l.target || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-medium">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Read-only security and compliance log</p>
        </div>
        <Button variant="outline" className="rounded-lg gap-2" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by actor, action, or target..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No audit logs found</TableCell></TableRow>
              ) : filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{format(new Date(l.created_date), 'dd MMM yyyy, HH:mm')}</TableCell>
                  <TableCell className="font-medium">{l.actor_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={l.actor_role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}>
                      {l.actor_role}
                    </Badge>
                  </TableCell>
                  <TableCell>{l.action}</TableCell>
                  <TableCell className="text-muted-foreground">{l.target || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}