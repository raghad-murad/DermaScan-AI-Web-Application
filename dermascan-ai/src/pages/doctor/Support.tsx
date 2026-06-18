import React, { useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  escalated: 'bg-primary/10 text-primary',
  resolved: 'bg-secondary/10 text-secondary',
};

export default function Support() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewTicket, setViewTicket] = useState(null);
  const [form, setForm] = useState({ subject: '', category: 'Technical', description: '' });

  const { data: tickets } = useQuery({
    queryKey: ['doctor-tickets', userId],
    queryFn: () => base44.entities.SupportTicket.filter({ doctor_id: userId }, '-created_date'),
    initialData: [],
    enabled: !!userId,
  });

  const handleSubmit = async () => {
    await base44.entities.SupportTicket.create({
      ...form,
      doctor_id: userId,
      doctor_name: user?.full_name || 'Doctor',
      status: 'pending',
    });
    queryClient.invalidateQueries({ queryKey: ['doctor-tickets'] });
    setForm({ subject: '', category: 'Technical', description: '' });
    setShowForm(false);
  };

  return (
    <div>
      <DoctorTopbar title="Support" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-heading font-medium">Support Tickets</h2>
          <Button className="rounded-lg gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Submit a Ticket
          </Button>
        </div>

        <Card className="border border-border rounded-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No tickets submitted</TableCell></TableRow>
                ) : tickets.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>{format(new Date(t.created_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[t.status]}>
                        {t.status === 'escalated' ? 'Escalated to IT' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setViewTicket(t)}>
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Submit Ticket Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit a Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Subject</Label>
                <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Account">Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Description</Label>
                <Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-lg" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="rounded-lg" onClick={handleSubmit} disabled={!form.subject || !form.description}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Ticket Dialog */}
        <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Ticket Details</DialogTitle></DialogHeader>
            {viewTicket && (
              <div className="space-y-4">
                <div><p className="text-xs text-muted-foreground">Subject</p><p className="text-sm font-medium">{viewTicket.subject}</p></div>
                <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm">{viewTicket.category}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="secondary" className={statusColors[viewTicket.status]}>{viewTicket.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{viewTicket.description}</p></div>
                {viewTicket.admin_reply && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Admin Response</p>
                    <p className="text-sm">{viewTicket.admin_reply}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}