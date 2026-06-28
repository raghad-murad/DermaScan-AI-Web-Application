import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, Mail, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiGet, apiPut, apiDelete } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/10 text-yellow-600',
  pending: 'bg-yellow-500/10 text-yellow-600',
  resolved: 'bg-secondary/10 text-secondary',
  rejected: 'bg-destructive/10 text-destructive',
};

const EMAIL_CHANGE_SUBJECT = 'Email Change Request';
const DELETION_REQUEST_TYPE = 'deletion_request';

const parseEmailChangeRequest = (message: string): { currentEmail: string; newEmail: string } | null => {
  const match = message?.match(/from (.+?) to (.+?)\.\s*Reason:/);
  if (!match) return null;
  return { currentEmail: match[1], newEmail: match[2] };
};

export default function AdminTickets() {
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [viewTicket, setViewTicket] = useState<any>(null);

  // General resolve dialog (non-email-change tickets)
  const [replyDialog, setReplyDialog] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [resolving, setResolving] = useState(false);

  // Email change approve/reject
  const [approveEmailTicket, setApproveEmailTicket] = useState<any>(null);
  const [approvingEmail, setApprovingEmail] = useState(false);
  const [rejectEmailDialog, setRejectEmailDialog] = useState<any>(null);
  const [emailRejectReason, setEmailRejectReason] = useState('');
  const [rejectingEmail, setRejectingEmail] = useState(false);

  // Account deletion
  const [deletionDialog, setDeletionDialog] = useState<any>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    setError('');
    return apiGet<any[]>('/api/support-tickets/')
      .then(data => setTickets(data))
      .catch(err => setError(err.message || 'Failed to load support tickets.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isLoadingAuth || !user) return;
    fetchTickets();
  }, [isLoadingAuth, user]);

  const filtered = tab === 'all' ? tickets : tickets.filter(t => t.status === tab);

  const handleResolve = async () => {
    setResolving(true);
    try {
      await apiPut(`/api/support-tickets/${replyDialog.id}`, {
        status: 'resolved',
        admin_reply: reply || 'Issue resolved.',
      });
      await fetchTickets();
      toast({ title: 'Ticket resolved' });
      setReplyDialog(null);
      setReply('');
    } catch (err: any) {
      toast({ title: 'Resolve failed', description: err.message || 'Could not resolve ticket.', variant: 'destructive' });
    } finally {
      setResolving(false);
    }
  };

  const handleApproveEmail = async () => {
    setApprovingEmail(true);
    try {
      await apiPut(`/api/support-tickets/resolve/${approveEmailTicket.id}`, { action: 'approve' });
      await fetchTickets();
      toast({ title: 'Email change approved', description: "Doctor's email has been updated." });
      setApproveEmailTicket(null);
    } catch (err: any) {
      toast({ title: 'Approval failed', description: err.message || 'Could not approve the email change.', variant: 'destructive' });
    } finally {
      setApprovingEmail(false);
    }
  };

  const handleRejectEmail = async () => {
    setRejectingEmail(true);
    try {
      await apiPut(`/api/support-tickets/resolve/${rejectEmailDialog.id}`, {
        action: 'reject',
        admin_message: emailRejectReason,
      });
      await fetchTickets();
      toast({ title: 'Email change rejected', description: 'The doctor has been notified.' });
      setRejectEmailDialog(null);
      setEmailRejectReason('');
    } catch (err: any) {
      toast({ title: 'Rejection failed', description: err.message || 'Could not reject the email change.', variant: 'destructive' });
    } finally {
      setRejectingEmail(false);
    }
  };

  const handleApproveDeletion = async () => {
    setDeletingAccount(true);
    try {
      await apiDelete(`/api/users/${deletionDialog.doctor_id}`);
      await fetchTickets();
      toast({ title: 'Account deleted', description: "The doctor's account and all data were permanently deleted." });
      setDeletionDialog(null);
    } catch (err: any) {
      toast({ title: 'Deletion failed', description: err.message || 'Could not delete the account.', variant: 'destructive' });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading font-medium">Support Tickets</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border border-border rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Loading tickets...</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-destructive">{error}</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No tickets found</TableCell></TableRow>
              ) : filtered.map(t => {
                const isEmailChange = t.subject === EMAIL_CHANGE_SUBJECT;
                const isDeletionRequest = t.type === DELETION_REQUEST_TYPE;
                const isOpen = t.status !== 'resolved' && t.status !== 'rejected';
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.doctor_id || '-'}</TableCell>
                    <TableCell>
                      {isDeletionRequest ? (
                        <Badge variant="destructive" className="gap-1">
                          <Trash2 className="h-3 w-3" /> Deletion Request
                        </Badge>
                      ) : isEmailChange ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
                          <Mail className="h-3 w-3" /> {t.subject}
                        </Badge>
                      ) : t.subject}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{t.message}</TableCell>
                    <TableCell>{t.created_at ? format(new Date(t.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[t.status] || statusColors.open}>
                        {t.status?.charAt(0).toUpperCase() + t.status?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewTicket(t)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {isOpen && isDeletionRequest && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletionDialog(t)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isOpen && isEmailChange && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" onClick={() => setApproveEmailTicket(t)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setRejectEmailDialog(t); setEmailRejectReason(''); }}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {isOpen && !isDeletionRequest && !isEmailChange && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" onClick={() => { setReplyDialog(t); setReply(''); }}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Ticket */}
      <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ticket Details</DialogTitle></DialogHeader>
          {viewTicket && (
            <div className="space-y-4">
              <div><p className="text-xs text-muted-foreground">Doctor ID</p><p className="text-sm font-medium">{viewTicket.doctor_id}</p></div>
              <div><p className="text-xs text-muted-foreground">Subject</p><p className="text-sm font-medium">{viewTicket.subject}</p></div>
              <div><p className="text-xs text-muted-foreground">Message</p><p className="text-sm">{viewTicket.message}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="secondary" className={statusColors[viewTicket.status] || statusColors.open}>{viewTicket.status}</Badge></div>
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

      {/* General Resolve Dialog */}
      <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Resolve Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Optional reply message to the doctor:</p>
            <Textarea placeholder="Reply message (optional)..." value={reply} onChange={e => setReply(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setReplyDialog(null)}>Cancel</Button>
            <Button className="rounded-lg gap-1.5" onClick={handleResolve} disabled={resolving}>
              <CheckCircle2 className="h-3.5 w-3.5" /> {resolving ? 'Resolving...' : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Email Change Dialog */}
      <Dialog open={!!approveEmailTicket} onOpenChange={() => setApproveEmailTicket(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Approve Email Change</DialogTitle></DialogHeader>
          {approveEmailTicket && (() => {
            const parsed = parseEmailChangeRequest(approveEmailTicket.message);
            return parsed ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will update the doctor's Firebase Auth and Firestore email address.
                </p>
                <div><p className="text-xs text-muted-foreground">Current Email</p><p className="text-sm font-medium">{parsed.currentEmail}</p></div>
                <div><p className="text-xs text-muted-foreground">New Email</p><p className="text-sm font-medium">{parsed.newEmail}</p></div>
              </div>
            ) : (
              <p className="text-sm text-destructive">Could not parse the requested email change from this ticket's message.</p>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setApproveEmailTicket(null)}>Cancel</Button>
            <Button
              className="rounded-lg gap-1.5"
              onClick={handleApproveEmail}
              disabled={approvingEmail || !parseEmailChangeRequest(approveEmailTicket?.message)}
            >
              <Check className="h-3.5 w-3.5" /> {approvingEmail ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Email Change Dialog */}
      <Dialog open={!!rejectEmailDialog} onOpenChange={() => { setRejectEmailDialog(null); setEmailRejectReason(''); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Reject Email Change</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Optionally provide a reason. The doctor will be notified by email.
            </p>
            <Textarea
              placeholder="Reason for rejection (optional)..."
              value={emailRejectReason}
              onChange={e => setEmailRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => { setRejectEmailDialog(null); setEmailRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" className="rounded-lg gap-1.5" onClick={handleRejectEmail} disabled={rejectingEmail}>
              <X className="h-3.5 w-3.5" /> {rejectingEmail ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Account Deletion Dialog */}
      <Dialog open={!!deletionDialog} onOpenChange={() => setDeletionDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Approve Account Deletion</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the doctor's account and ALL their data (patients, analyses, tickets). This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setDeletionDialog(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-lg gap-1.5" onClick={handleApproveDeletion} disabled={deletingAccount}>
              <Trash2 className="h-3.5 w-3.5" /> {deletingAccount ? 'Deleting...' : 'Approve Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
