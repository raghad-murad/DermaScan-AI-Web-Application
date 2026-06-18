import React, { useState } from 'react';
import { Eye, Check, HelpCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  approved: 'bg-secondary/10 text-secondary',
  rejected: 'bg-destructive/10 text-destructive',
  more_info: 'bg-primary/10 text-primary',
};

const moreInfoTemplates = [
  'License document is unclear or unreadable',
  'Medical license number not found in registry',
  'Missing required field',
  'Custom message...',
];

export default function AccountRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [viewRequest, setViewRequest] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [moreInfoDialog, setMoreInfoDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [moreInfoMsg, setMoreInfoMsg] = useState('');

  const { data: requests } = useQuery({
    queryKey: ['account-requests'],
    queryFn: () => base44.entities.AccountRequest.list('-created_date', 100),
    initialData: [],
  });

  const filtered = tab === 'all' ? requests : requests.filter(r => r.status === tab);

  const handleApprove = async (req) => {
    await base44.entities.AccountRequest.update(req.id, {
      status: 'approved',
      reviewed_by: user?.full_name,
      reviewed_at: new Date().toISOString(),
    });
    await base44.entities.AuditLog.create({
      actor_id: user?.id, actor_name: user?.full_name, actor_role: 'admin',
      action: 'Approved doctor account request', target: req.full_name,
    });
    queryClient.invalidateQueries({ queryKey: ['account-requests'] });
    queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] });
    setViewRequest(null);
  };

  const handleReject = async () => {
    await base44.entities.AccountRequest.update(rejectDialog.id, {
      status: 'rejected',
      admin_message: rejectReason,
      reviewed_by: user?.full_name,
      reviewed_at: new Date().toISOString(),
    });
    await base44.entities.AuditLog.create({
      actor_id: user?.id, actor_name: user?.full_name, actor_role: 'admin',
      action: 'Rejected doctor account request', target: rejectDialog.full_name, details: rejectReason,
    });
    queryClient.invalidateQueries({ queryKey: ['account-requests'] });
    queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] });
    setRejectDialog(null);
    setRejectReason('');
  };

  const handleMoreInfo = async () => {
    await base44.entities.AccountRequest.update(moreInfoDialog.id, {
      status: 'more_info',
      admin_message: moreInfoMsg,
      reviewed_by: user?.full_name,
    });
    queryClient.invalidateQueries({ queryKey: ['account-requests'] });
    setMoreInfoDialog(null);
    setMoreInfoMsg('');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading font-medium">Account Requests</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="more_info">More Info Needed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border border-border rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>License No.</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No requests found</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>{r.specialty}</TableCell>
                  <TableCell>{r.hospital}</TableCell>
                  <TableCell>{r.license_number}</TableCell>
                  <TableCell>{format(new Date(r.created_date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[r.status]}>
                      {r.status === 'more_info' ? 'More Info' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewRequest(r)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {r.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" onClick={() => handleApprove(r)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setMoreInfoDialog(r); setMoreInfoMsg(''); }}>
                            <HelpCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setRejectDialog(r); setRejectReason(''); }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Details Sheet */}
      <Sheet open={!!viewRequest} onOpenChange={() => setViewRequest(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>Request Details</SheetTitle></SheetHeader>
          {viewRequest && (
            <div className="space-y-5 mt-6">
              {[
                ['Full Name', viewRequest.full_name],
                ['Email', viewRequest.email],
                ['Phone', viewRequest.phone],
                ['Specialty', viewRequest.specialty],
                ['Hospital', viewRequest.hospital],
                ['License Number', viewRequest.license_number],
                ['License Authority', viewRequest.license_authority],
                ['Preferred Username', viewRequest.preferred_username],
                ['Submitted', format(new Date(viewRequest.created_date), 'dd MMM yyyy HH:mm')],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className="text-sm mt-0.5">{val || '-'}</p>
                </div>
              ))}
              {viewRequest.document_url && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">License Document</p>
                  <a href={viewRequest.document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">View Document</a>
                </div>
              )}
              {viewRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button className="rounded-lg gap-1.5" size="sm" onClick={() => handleApprove(viewRequest)}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button variant="outline" className="rounded-lg gap-1.5" size="sm" onClick={() => { setMoreInfoDialog(viewRequest); setViewRequest(null); }}>
                    <HelpCircle className="h-3.5 w-3.5" /> More Info
                  </Button>
                  <Button variant="destructive" className="rounded-lg gap-1.5" size="sm" onClick={() => { setRejectDialog(viewRequest); setViewRequest(null); }}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Provide a reason for rejecting {rejectDialog?.full_name}'s request. This will be sent in the rejection email.</p>
            <Textarea placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-lg" onClick={handleReject} disabled={!rejectReason}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* More Info Dialog */}
      <Dialog open={!!moreInfoDialog} onOpenChange={() => setMoreInfoDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request More Information</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Select a template or write custom message</Label>
              <Select onValueChange={v => setMoreInfoMsg(v === 'Custom message...' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                <SelectContent>
                  {moreInfoTemplates.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Message to the applicant..." value={moreInfoMsg} onChange={e => setMoreInfoMsg(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setMoreInfoDialog(null)}>Cancel</Button>
            <Button className="rounded-lg" onClick={handleMoreInfo} disabled={!moreInfoMsg}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}