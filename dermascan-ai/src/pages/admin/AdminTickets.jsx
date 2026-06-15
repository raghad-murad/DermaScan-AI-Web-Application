import React, { useState } from 'react';
import { Eye, ArrowUpRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  escalated: 'bg-primary/10 text-primary',
  resolved: 'bg-secondary/10 text-secondary',
};

export default function AdminTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [viewTicket, setViewTicket] = useState(null);
  const [replyDialog, setReplyDialog] = useState(null);
  const [reply, setReply] = useState('');

  const { data: tickets } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 200),
    initialData: [],
  });

  const filtered = tab === 'all' ? tickets : tickets.filter(t => t.status === tab);

  const handleEscalate = async (ticket) => {
    await base44.entities.SupportTicket.update(ticket.id, { status: 'escalated' });
    await base44.entities.AuditLog.create({
      actor_id: user?.id, actor_name: user?.full_name, actor_role: 'admin',
      action: 'Escalated support ticket to IT', target: `Ticket: ${ticket.subject}`,
    });
    queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['open-tickets'] });
  };

  const handleResolve = async () => {
    await base44.entities.SupportTicket.update(replyDialog.id, {
      status: 'resolved',
      admin_reply: reply || 'Issue resolved.',
      resolved_by: user?.full_name,
      resolved_at: new Date().toISOString(),
    });
    await base44.entities.AuditLog.create({
      actor_id: user?.id, actor_name: user?.full_name, actor_role: 'admin',
      action: 'Resolved support ticket', target: `Ticket: ${replyDialog.subject}`,
    });
    queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['open-tickets'] });
    setReplyDialog(null);
    setReply('');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading font-medium">Support Tickets</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="escalated">Escalated to IT</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border border-border rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No tickets found</TableCell></TableRow>
              ) : filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.doctor_name || '-'}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>{format(new Date(t.created_date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[t.status]}>
                      {t.status === 'escalated' ? 'Escalated to IT' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewTicket(t)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {t.status === 'pending' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEscalate(t)}>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {t.status !== 'resolved' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" onClick={() => { setReplyDialog(t); setReply(''); }}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Ticket */}
      <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ticket Details</DialogTitle></DialogHeader>
          {viewTicket && (
            <div className="space-y-4">
              <div><p className="text-xs text-muted-foreground">Doctor</p><p className="text-sm font-medium">{viewTicket.doctor_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Subject</p><p className="text-sm font-medium">{viewTicket.subject}</p></div>
              <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm">{viewTicket.category}</p></div>
              <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{viewTicket.description}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="secondary" className={statusColors[viewTicket.status]}>{viewTicket.status}</Badge></div>
              {viewTicket.admin_reply && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Admin Reply</p>
                  <p className="text-sm">{viewTicket.admin_reply}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Optional reply message to the doctor:</p>
            <Textarea placeholder="Reply message (optional)..." value={reply} onChange={e => setReply(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setReplyDialog(null)}>Cancel</Button>
            <Button className="rounded-lg gap-1.5" onClick={handleResolve}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}