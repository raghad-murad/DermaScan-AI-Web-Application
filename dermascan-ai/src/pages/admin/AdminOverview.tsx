import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, FileText, Clock, LifeBuoy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminOverview() {
  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: analyses } = useQuery({
    queryKey: ['all-analyses'],
    queryFn: () => base44.entities.Analysis.list('-created_date', 1000),
    initialData: [],
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests-count'],
    queryFn: () => base44.entities.AccountRequest.filter({ status: 'pending' }),
    initialData: [],
  });

  const { data: openTickets } = useQuery({
    queryKey: ['open-tickets'],
    queryFn: () => base44.entities.SupportTicket.filter({ status: 'pending' }),
    initialData: [],
  });

  const doctors = users.filter(u => u.role === 'user');

  const stats = [
    { label: 'Active Doctors', value: doctors.length, icon: Stethoscope, color: 'bg-primary/10 text-primary' },
    { label: 'Total AI Cases', value: analyses.length, icon: FileText, color: 'bg-secondary/10 text-secondary' },
    { label: 'Pending Requests', value: pendingRequests.length, icon: Clock, color: pendingRequests.length > 0 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground', link: '/admin/requests' },
    { label: 'Open Tickets', value: openTickets.length, icon: LifeBuoy, color: openTickets.length > 0 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground', link: '/admin/tickets' },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-medium">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">System status at a glance</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(s => {
          const content = (
            <Card key={s.label} className={`border border-border rounded-xl ${s.link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                    <p className="text-3xl font-heading font-medium mt-1">{s.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${s.color} flex items-center justify-center`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          return s.link ? <Link key={s.label} to={s.link}>{content}</Link> : <React.Fragment key={s.label}>{content}</React.Fragment>;
        })}
      </div>
    </div>
  );
}