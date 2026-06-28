import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiGet, apiPut, apiPost } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  approved: 'bg-secondary/10 text-secondary',
  rejected: 'bg-destructive/10 text-destructive',
};

const emptyDoctorForm = { full_name: '', email: '', specialty: '', hospital: '', license_number: '', username: '', phonenumber: '', password: '' };

export default function AccountRequests() {
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [viewRequest, setViewRequest] = useState<any>(null);
  const [rejectDialog, setRejectDialog] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [pendingApproveRequest, setPendingApproveRequest] = useState<any>(null);
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [creatingDoctor, setCreatingDoctor] = useState(false);
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);

  const base64ToBlobUrl = (base64: string, contentType: string) => {
    const byteChars = atob(base64);
    const byteArray = new Uint8Array([...byteChars].map(c => c.charCodeAt(0)));
    const blob = new Blob([byteArray], { type: contentType });
    return URL.createObjectURL(blob);
  };

  const handleViewDocument = (request: any) => {
    const url = base64ToBlobUrl(request.document_base64, request.document_content_type);
    window.open(url, '_blank');
  };

  const handleDownloadDocument = (request: any) => {
    const url = base64ToBlobUrl(request.document_base64, request.document_content_type);
    const link = document.createElement('a');
    link.href = url;
    link.download = request.document_filename || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchRequests = () => {
    setLoading(true);
    setError('');
    return apiGet<any[]>('/api/account-requests/')
      .then(data => setRequests(data))
      .catch(err => setError(err.message || 'Failed to load account requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isLoadingAuth || !user) return;
    fetchRequests();
  }, [isLoadingAuth, user]);

  const filtered = tab === 'all' ? requests : requests.filter(r => r.status === tab);

  const handleApprove = (req: any) => {
    setViewRequest(null);
    setDoctorForm({
      full_name: req.full_name || '',
      email: req.email || '',
      specialty: req.specialty || '',
      hospital: req.hospital || '',
      license_number: req.license_number || '',
      username: (req.preferred_username || '').replace(/^dr\./, ''),
      phonenumber: req.phone || '',
      password: req.preferred_password || '',
    });
    setPendingApproveRequest(req);
    setShowCreateDoctor(true);
  };

  const handleReject = async () => {
    setActioningId(rejectDialog.id);
    try {
      await apiPut(`/api/account-requests/${rejectDialog.id}`, { status: 'rejected', admin_message: rejectReason });
      await fetchRequests();
      toast({ title: 'Request rejected', description: `${rejectDialog.full_name}'s account request was rejected.` });
      setRejectDialog(null);
      setRejectReason('');
    } catch (err: any) {
      toast({ title: 'Rejection failed', description: err.message || 'Could not reject request.', variant: 'destructive' });
    } finally {
      setActioningId(null);
    }
  };

  const handleCreateDoctor = async () => {
    if (!pendingApproveRequest) return;
    setCreatingDoctor(true);
    try {
      await apiPut(`/api/account-requests/${pendingApproveRequest.id}`, { status: 'approved' });
      await apiPost('/api/users/create-doctor', {
        full_name: doctorForm.full_name,
        email: doctorForm.email,
        specialty: doctorForm.specialty,
        hospital: doctorForm.hospital,
        license_number: doctorForm.license_number,
        username: doctorForm.username,
        phonenumber: doctorForm.phonenumber,
        password: doctorForm.password,
      });
      toast({ title: 'Doctor account created successfully' });
      setShowCreateDoctor(false);
      setPendingApproveRequest(null);
      setDoctorForm(emptyDoctorForm);
      await fetchRequests();
    } catch (err: any) {
      toast({ title: 'Account creation failed', description: err.message || 'Could not create the doctor account.', variant: 'destructive' });
    } finally {
      setCreatingDoctor(false);
    }
  };

  const handleCreateDoctorCancel = () => {
    toast({ title: 'Request remains pending', description: 'No account was created.' });
    setShowCreateDoctor(false);
    setPendingApproveRequest(null);
    setDoctorForm(emptyDoctorForm);
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
        </TabsList>
      </Tabs>

      <Card className="border border-border rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>License No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading account requests...</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-destructive">{error}</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No requests found</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.specialty}</TableCell>
                  <TableCell>{r.hospital}</TableCell>
                  <TableCell>{r.license_number}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[r.status]}>
                      {r.status?.charAt(0).toUpperCase() + r.status?.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewRequest(r)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {r.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" disabled={actioningId === r.id} onClick={() => handleApprove(r)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={actioningId === r.id} onClick={() => { setRejectDialog(r); setRejectReason(''); }}>
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

      {/* View Details Modal */}
      <Dialog open={!!viewRequest} onOpenChange={() => setViewRequest(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Request Details</DialogTitle></DialogHeader>
          {viewRequest && (
            <div className="space-y-5">
              {[
                ['Full Name', viewRequest.full_name],
                ['Email', viewRequest.email],
                ['Specialty', viewRequest.specialty],
                ['Hospital', viewRequest.hospital],
                ['License Number', viewRequest.license_number],
                ['Preferred Password', viewRequest.preferred_password],
                ['Status', viewRequest.status],
                ['Admin Message', viewRequest.admin_message],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className="text-sm mt-0.5">{val || '-'}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-muted-foreground font-medium">Document</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm">{viewRequest.document_base64 ? (viewRequest.document_filename || 'document') : 'No document uploaded'}</p>
                  {viewRequest.document_base64 && (
                    <>
                      <Button variant="outline" size="sm" className="h-7 rounded-md gap-1 px-2" onClick={() => handleViewDocument(viewRequest)}>
                        <ExternalLink className="h-3 w-3" /> View
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 rounded-md gap-1 px-2" onClick={() => handleDownloadDocument(viewRequest)}>
                        <Download className="h-3 w-3" /> Download
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {viewRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button className="rounded-lg gap-1.5" size="sm" disabled={actioningId === viewRequest.id} onClick={() => handleApprove(viewRequest)}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button variant="destructive" className="rounded-lg gap-1.5" size="sm" onClick={() => { setRejectDialog(viewRequest); setViewRequest(null); }}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Reject Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Provide a reason for rejecting {rejectDialog?.full_name}'s request.</p>
            <Textarea placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-lg" onClick={handleReject} disabled={!rejectReason || actioningId === rejectDialog?.id}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Doctor Account Modal (post-approval) */}
      <Dialog open={showCreateDoctor} onOpenChange={(open) => { if (!open) setShowCreateDoctor(false); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Doctor Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Full Name</Label>
              <Input value={doctorForm.full_name} onChange={e => setDoctorForm({ ...doctorForm, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Email</Label>
              <Input type="email" value={doctorForm.email} onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Specialty</Label>
              <Input value={doctorForm.specialty} onChange={e => setDoctorForm({ ...doctorForm, specialty: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Hospital</Label>
              <Input value={doctorForm.hospital} onChange={e => setDoctorForm({ ...doctorForm, hospital: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">License Number</Label>
              <Input value={doctorForm.license_number} onChange={e => setDoctorForm({ ...doctorForm, license_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Username</Label>
              <Input value={doctorForm.username} onChange={e => setDoctorForm({ ...doctorForm, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Phone Number</Label>
              <Input value={doctorForm.phonenumber} onChange={e => setDoctorForm({ ...doctorForm, phonenumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Password</Label>
              <div className="relative">
                <Input
                  type={showDoctorPassword ? 'text' : 'password'}
                  value={doctorForm.password}
                  onChange={e => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showDoctorPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={handleCreateDoctorCancel}>Cancel</Button>
            <Button
              className="rounded-lg"
              onClick={handleCreateDoctor}
              disabled={creatingDoctor || !doctorForm.full_name || !doctorForm.email || !doctorForm.password}
            >
              {creatingDoctor ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
