'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICardGrid } from '@/components/dashboard/KPICardGrid';
import { TodaysWorkSection } from '@/components/dashboard/TodaysWorkSection';
import { OverdueSection } from '@/components/dashboard/OverdueSection';
import { LeadPipelineSection } from '@/components/dashboard/LeadPipelineSection';
import { ConversionFunnelSection } from '@/components/dashboard/ConversionFunnelSection';
import { AnalyticsChartsSection } from '@/components/dashboard/AnalyticsChartsSection';
import { CallAnalyticsCard } from '@/components/dashboard/CallAnalyticsCard';
import { UpcomingActivitiesAndFeed } from '@/components/dashboard/UpcomingActivitiesAndFeed';
import { RecentLeadsAndClientsTables } from '@/components/dashboard/RecentLeadsAndClientsTables';

// Modals
import { AddLeadModal } from '@/components/leads/AddLeadModal';
import { MarkCalledModal } from '@/components/leads/MarkCalledModal';
import { ScheduleFollowUpModal } from '@/components/leads/ScheduleFollowUpModal';
import { ScheduleDemoModal } from '@/components/demos/ScheduleDemoModal';
import { FollowUpItemData } from '@/components/followups/FollowUpCard';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  // Global Date Filter State
  const [period, setPeriod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [scheduleDemoOpen, setScheduleDemoOpen] = useState(false);
  const [callModalData, setCallModalData] = useState<{
    isOpen: boolean;
    leadId: string;
    leadName: string;
    leadMobile: string;
  }>({
    isOpen: false,
    leadId: '',
    leadName: '',
    leadMobile: '',
  });

  const [rescheduleData, setRescheduleData] = useState<{
    isOpen: boolean;
    leadId: string;
    leadName: string;
    initialFollowUp?: {
      id: string;
      followUpDate: string;
      followUpTime: string;
      note: string;
    };
  }>({
    isOpen: false,
    leadId: '',
    leadName: '',
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clientToday = new Date().toLocaleDateString('sv');
      let url = `/api/dashboard/stats?period=${period}&clientDate=${clientToday}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load dashboard data');

      const data = await res.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handlers for Follow-up actions
  const handleCompleteFollowUp = async (item: FollowUpItemData) => {
    try {
      const res = await fetch(`/api/follow-ups/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COMPLETE' }),
      });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Failed to complete follow up:', err);
    }
  };

  const handleCompleteDemo = async (demo: any) => {
    try {
      const res = await fetch(`/api/demos/${demo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error('Failed to complete demo:', err);
    }
  };

  const summary = dashboardData?.summary || {
    totalLeads: 0,
    totalLeadsGrowth: 0,
    newLeads: 0,
    calledLeads: 0,
    interestedLeads: 0,
    followUpLeads: 0,
    demoLeads: 0,
    quotationLeads: 0,
    convertedClients: 0,
    pendingFollowUps: 0,
    todayFollowUpsCount: 0,
    overdueFollowUpsCount: 0,
    upcomingDemosCount: 0,
    todayDemosCount: 0,
    completedDemosCount: 0,
    totalQuotations: 0,
    draftQuotations: 0,
    sentQuotations: 0,
    acceptedQuotations: 0,
    totalQuotationValue: 0,
    acceptedQuotationValue: 0,
    quotationAcceptanceRate: 0,
    totalClients: 0,
    activeClients: 0,
    convertedThisMonth: 0,
    overallConversionRate: 0,
  };

  return (
    <AppLayout
      title="Dashboard"
      onAddLeadClick={() => setAddLeadOpen(true)}
      overdueCount={dashboardData?.summary?.overdueFollowUpsCount || 0}
    >
      <div className="space-y-8 pb-16">
        {/* Header with Global Date Filter & Quick Actions */}
        <DashboardHeader
          period={period}
          onPeriodChange={setPeriod}
          startDate={startDate}
          endDate={endDate}
          onCustomDateChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
          onAddLeadClick={() => setAddLeadOpen(true)}
          onScheduleFollowUpClick={() =>
            setRescheduleData({ isOpen: true, leadId: '', leadName: '' })
          }
          onScheduleDemoClick={() => setScheduleDemoOpen(true)}
        />

        {/* Error Handling State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-800 font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors inline-flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Priority 1 & 2: Overdue Warning & Today's Work */}
        <OverdueSection
          overdueFollowUps={dashboardData?.overdueFollowUps || []}
          onCall={(item) =>
            setCallModalData({
              isOpen: true,
              leadId: item.lead.id,
              leadName: item.lead.name,
              leadMobile: item.lead.mobile,
            })
          }
          onComplete={handleCompleteFollowUp}
          onReschedule={(item) =>
            setRescheduleData({
              isOpen: true,
              leadId: item.lead.id,
              leadName: item.lead.name,
              initialFollowUp: {
                id: item.id,
                followUpDate: item.followUpDate,
                followUpTime: item.followUpTime,
                note: item.note,
              },
            })
          }
        />

        <TodaysWorkSection
          todayFollowUps={dashboardData?.todaysWork?.followUps || []}
          todayDemos={dashboardData?.todaysWork?.demos || []}
          onCallFollowUp={(item) =>
            setCallModalData({
              isOpen: true,
              leadId: item.lead.id,
              leadName: item.lead.name,
              leadMobile: item.lead.mobile,
            })
          }
          onCompleteFollowUp={handleCompleteFollowUp}
          onRescheduleFollowUp={(item) =>
            setRescheduleData({
              isOpen: true,
              leadId: item.lead.id,
              leadName: item.lead.name,
              initialFollowUp: {
                id: item.id,
                followUpDate: item.followUpDate,
                followUpTime: item.followUpTime,
                note: item.note,
              },
            })
          }
          onCompleteDemo={handleCompleteDemo}
          loading={loading}
        />

        {/* Priority 3: Main KPI Statistics Cards */}
        <KPICardGrid summary={summary} loading={loading} />

        {/* Call Analytics & Response Conversion Breakdown */}
        <CallAnalyticsCard callAnalytics={dashboardData?.callAnalytics} period={period} />

        {/* Priority 4: Lead Pipeline & Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadPipelineSection pipeline={dashboardData?.pipeline || {}} totalLeads={summary.totalLeads} />
          <ConversionFunnelSection funnel={dashboardData?.conversionFunnel || []} />
        </div>

        {/* Priority 5: Analytics Charts (Lead Generation, Sources, Quotations, Conversion) */}
        <AnalyticsChartsSection
          leadSources={dashboardData?.leadSources || []}
          leadGenerationTrend={dashboardData?.leadGenerationTrend || []}
          quotationAnalytics={dashboardData?.quotationAnalytics || {}}
          clientConversion={dashboardData?.clientConversionAnalytics || {}}
        />

        {/* Priority 6: Upcoming Activities Timeline & Live Audit Activity Feed */}
        <UpcomingActivitiesAndFeed
          upcomingActivities={dashboardData?.upcomingActivities || []}
          recentActivities={dashboardData?.recentActivities || []}
          onRefreshActivity={fetchDashboardData}
        />

        {/* Priority 7: Recent Leads & Recent Converted Clients Tables */}
        <RecentLeadsAndClientsTables
          recentLeads={dashboardData?.recentLeads || []}
          recentClients={dashboardData?.recentClients || []}
        />
      </div>

      {/* Modals */}
      <AddLeadModal
        isOpen={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        onLeadAdded={fetchDashboardData}
      />

      <MarkCalledModal
        isOpen={callModalData.isOpen}
        onClose={() => setCallModalData((prev) => ({ ...prev, isOpen: false }))}
        leadId={callModalData.leadId}
        leadName={callModalData.leadName}
        leadMobile={callModalData.leadMobile}
        onCallRecorded={fetchDashboardData}
      />

      <ScheduleFollowUpModal
        isOpen={rescheduleData.isOpen}
        onClose={() => setRescheduleData((prev) => ({ ...prev, isOpen: false }))}
        leadId={rescheduleData.leadId}
        leadName={rescheduleData.leadName}
        initialFollowUp={rescheduleData.initialFollowUp}
        isReschedule={!!rescheduleData.initialFollowUp}
        onFollowUpScheduled={fetchDashboardData}
      />

      <ScheduleDemoModal
        isOpen={scheduleDemoOpen}
        onClose={() => setScheduleDemoOpen(false)}
        onDemoScheduled={fetchDashboardData}
      />
    </AppLayout>
  );
}
