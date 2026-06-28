import React, { useState, useEffect } from 'react';
import { Plus, Shield, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiGet, apiPost } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';

const emptyForm = { full_name: '', email: '', username: '', password: '' };

export default function ManageAdmins() {
  const { user, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAdmins = () => {
    setLoading(true);
    setError('');
    return apiGet<any[]>('/api/users/?role=admin')
      .then(data => setAdmins(data))
      .catch(err => setError(err.message || 'Failed to load admins.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isLoadingAuth || !user) return;
    fetchAdmins();
  }, [isLoadingAuth, user]);

  const handleAddAdmin = async () => {
    setCreating(true);
    try {
      await apiPost('/api/users/create-admin', {
        full_name: form.full_name,
        email: form.email,
        username: `admin.${form.username}`,
        password: form.password,
      });
      await fetchAdmins();
      toast({ title: 'Admin created', description: `${form.full_name} can now sign in as an admin.` });
      setShowPanel(false);
      setForm(emptyForm);
    } catch (err: any) {
      toast({ title: 'Creation failed', description: err.message || 'Could not create admin.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
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
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Loading admins...</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-destructive">{error}</TableCell></TableRow>
              ) : admins.length === 0 ? (
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
                  <TableCell>{a.created_at ? format(new Date(a.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border border-border rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Add Admin</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Full Name</Label>
              <Input placeholder="Admin's full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Email Address</Label>
              <Input type="email" placeholder="admin@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Preferred Username</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-lg border border-border">admin.</span>
                <Input placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-primary">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Temporary password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-lg" onClick={() => setShowPanel(false)}>Cancel</Button>
            <Button className="rounded-lg" onClick={handleAddAdmin} disabled={creating || !form.email || !form.full_name || !form.password}>
              {creating ? 'Creating...' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
