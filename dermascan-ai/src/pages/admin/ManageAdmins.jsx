import React, { useState } from 'react';
import { Plus, UserX, Trash2, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';

export default function ManageAdmins() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPanel, setShowPanel] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', username: '' });

  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const admins = users.filter(u => u.role === 'admin');

  const handleAddAdmin = async () => {
    await base44.users.inviteUser(form.email, 'admin');
    await base44.entities.AuditLog.create({
      actor_id: user?.id, actor_name: user?.full_name, actor_role: 'admin',
      action: 'Created new admin account', target: form.full_name,
    });
    queryClient.invalidateQueries({ queryKey: ['all-users'] });
    setShowPanel(false);
    setForm({ full_name: '', email: '', username: '' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-medium">Manage Admins</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin accounts can only be created here. No public registration.</p>
        </div>
        <Button className="rounded-lg gap-2" onClick={() => setShowPanel(true)}>
          <Plus className="h-4 w-4" /> Add Admin
        </Button>
      </div>

      <Card className="border border-border rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No admins found</TableCell></TableRow>
              ) : admins.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-secondary" />
                      {a.full_name}
                      {a.id === user?.id && <Badge variant="outline" className="text-xs">You</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell><Badge variant="secondary" className="bg-primary/10 text-primary">Admin</Badge></TableCell>
                  <TableCell>{format(new Date(a.created_date), 'dd MMM yyyy')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={showPanel} onOpenChange={setShowPanel}>
        <SheetContent>
          <SheetHeader><SheetTitle>Add Admin</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Preferred Username</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-lg">admin.</span>
                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" className="rounded-lg" onClick={() => setShowPanel(false)}>Cancel</Button>
            <Button className="rounded-lg" onClick={handleAddAdmin} disabled={!form.email}>Create Admin</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}