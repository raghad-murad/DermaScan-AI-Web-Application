import React, { useState, useEffect } from 'react';
import { Plus, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { apiGet, apiPost } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/10 text-yellow-600',
  escalated: 'bg-primary/10 text-primary',
  resolved: 'bg-secondary/10 text-secondary',
  closed: 'bg-secondary/10 text-secondary',
};

const emptyForm = { subject: '', category: 'Technical', message: '' };

export default function Support() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewTicket, setViewTicket] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    setError('');
    return apiGet<any[]>('/api/support-tickets/')
      .then(data => setTickets(data))
      .catch(err => setError(err.message || 'Failed to load support tickets.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiPost('/api/support-tickets/', {
        subject: form.subject,
        message: form.message,
        category: form.category,
        doctor_id: user?.uid || user?.id,
      });
      await fetchTickets();
      toast({ title: 'Ticket submitted', description: 'Our team will get back to you soon.' });
      setForm(emptyForm);
      setShowForm(false);
    } catch (err: any) {
      toast({ title: 'Submission failed', description: err.message || 'Could not submit your ticket.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
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
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading tickets...</TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-destructive">{error}</TableCell></TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No tickets submitted</TableCell></TableRow>
                ) : tickets.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell>{t.category || '-'}</TableCell>
                    <TableCell>{t.created_at ? format(new Date(t.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[t.status] || statusColors.open}>
                        {t.status === 'escalated' ? 'Escalated to IT' : (t.status?.charAt(0).toUpperCase() + t.status?.slice(1))}
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                <Textarea rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-lg" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="rounded-lg" onClick={handleSubmit} disabled={submitting || !form.subject || !form.message}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Ticket Dialog */}
        <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Ticket Details</DialogTitle></DialogHeader>
            {viewTicket && (
              <div className="space-y-4">
                <div><p className="text-xs text-muted-foreground">Subject</p><p className="text-sm font-medium">{viewTicket.subject}</p></div>
                <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm">{viewTicket.category || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="secondary" className={statusColors[viewTicket.status] || statusColors.open}>{viewTicket.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{viewTicket.message}</p></div>
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
