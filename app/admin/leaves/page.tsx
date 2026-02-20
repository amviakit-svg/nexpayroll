'use client';

import { useState, useEffect } from 'react';

interface LeaveType {
  id: string;
  name: string;
  color: string;
  description: string | null;
  isActive: boolean;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

interface LeaveRequest {
  id: string;
  leaveType: LeaveType;
  employee: { id: string; name: string; email: string };
  startDate: string;
  endDate: string;
  daysRequested: number;
  stage: number;
  status: 'PENDING' | 'APPROVED_BY_MANAGER' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string | null;
  requestedAt: string;
  approver: { name: string } | null;
  comments: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  balanceDays: number;
  leaveType: LeaveType;
}

export default function AdminLeavesPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'types' | 'holidays' | 'calendar' | 'balances'>('requests');
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [calendarRequests, setCalendarRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calendar date
  const [currentDate, setCurrentDate] = useState(new Date());
  const calYear = currentDate.getFullYear();
  const calMonth = currentDate.getMonth() + 1;

  // Forms
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', color: '#3B82F6', description: '' });

  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '' });

  // Approval form
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Balance Management
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [balanceForm, setBalanceForm] = useState({ leaveTypeId: '', amount: 0, action: 'SET' });

  // Conflict state
  const [conflicts, setConflicts] = useState<Record<string, { absentCount: number, totalTeamSize: number }>>({});

  useEffect(() => {
    fetchData();
  }, [activeTab, calYear, calMonth]);

  useEffect(() => {
    if (activeTab === 'balances' && selectedUser) {
      fetchBalances();
    }
  }, [selectedUser, activeTab, calYear, calMonth]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'types' || activeTab === 'requests' || activeTab === 'balances') {
        const ltRes = await fetch('/api/admin/leave-types');
        if (ltRes.ok) setLeaveTypes(await ltRes.json());
      }

      if (activeTab === 'requests') {
        const reqRes = await fetch('/api/admin/leaves');
        if (reqRes.ok) {
          const fetchedRequests = await reqRes.json();
          setRequests(fetchedRequests);

          // Fetch conflicts for pending requests
          fetchedRequests.forEach(async (req: LeaveRequest) => {
            if (req.status === 'PENDING' || req.status === 'APPROVED_BY_MANAGER') {
              const confRes = await fetch(`/api/leave-conflicts?employeeId=${req.employee.id}&startDate=${req.startDate}&endDate=${req.endDate}`);
              if (confRes.ok) {
                const confData = await confRes.json();
                setConflicts(prev => ({ ...prev, [req.id]: confData }));
              }
            }
          });
        }
      }

      if (activeTab === 'holidays') {
        const holRes = await fetch(`/api/admin/holidays?year=${calYear}`);
        if (holRes.ok) setHolidays(await holRes.json());
      }

      if (activeTab === 'calendar') {
        const calRes = await fetch(`/api/admin/leave-calendar?year=${calYear}&month=${calMonth}`);
        if (calRes.ok) setCalendarRequests(await calRes.json());
      }

      if (activeTab === 'balances') {
        const uRes = await fetch('/api/admin/users');
        if (uRes.ok) setUsers(await uRes.json());
      }
    } catch (e) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBalances() {
    if (!selectedUser) return;
    const res = await fetch(`/api/admin/leaves/balance?employeeId=${selectedUser}&year=${calYear}&month=${calMonth}`);
    if (res.ok) setBalances(await res.json());
  }

  async function saveType(e: React.FormEvent) {
    e.preventDefault();
    try {
      const method = editingType ? 'PUT' : 'POST';
      const body = editingType ? { ...typeForm, id: editingType.id } : typeForm;

      const res = await fetch('/api/admin/leave-types', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Failed to save');

      setSuccess(editingType ? 'Leave type updated!' : 'Leave type created!');
      setShowTypeForm(false);
      setEditingType(null);
      setTypeForm({ name: '', color: '#3B82F6', description: '' });
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteType(id: string) {
    if (!confirm('Delete this leave type?')) return;
    try {
      const res = await fetch(`/api/admin/leave-types?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Leave type deleted');
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggleTypeActive(type: LeaveType) {
    try {
      const res = await fetch('/api/admin/leave-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: type.id, isActive: !type.isActive })
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function saveHoliday(e: React.FormEvent) {
    e.preventDefault();
    try {
      const method = editingHoliday ? 'PUT' : 'POST';
      const body = editingHoliday ? { ...holidayForm, id: editingHoliday.id } : holidayForm;

      const res = await fetch('/api/admin/holidays', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Failed to save');

      setSuccess(editingHoliday ? 'Holiday updated!' : 'Holiday created!');
      setShowHolidayForm(false);
      setEditingHoliday(null);
      setHolidayForm({ name: '', date: '' });
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteHoliday(id: string) {
    if (!confirm('Delete this holiday?')) return;
    try {
      const res = await fetch(`/api/admin/holidays?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Holiday deleted');
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function processRequest(requestId: string, action: 'APPROVE' | 'REJECT') {
    try {
      setProcessingId(requestId);
      const res = await fetch('/api/admin/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, comments: approvalComment })
      });

      if (!res.ok) throw new Error('Failed to process');

      setSuccess(`Request ${action === 'APPROVE' ? 'approved' : 'rejected'}!`);
      setApprovalComment('');
      fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessingId(null);
    }
  }

  async function updateBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser || !balanceForm.leaveTypeId) return;
    try {
      const res = await fetch('/api/admin/leaves/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedUser,
          leaveTypeId: balanceForm.leaveTypeId,
          year: calYear,
          month: calMonth,
          amount: balanceForm.amount,
          action: balanceForm.action
        })
      });
      if (!res.ok) throw new Error('Failed to update balance');
      setSuccess('Balance updated');
      fetchBalances();
      // Reset amount but keep user/type selected
      setBalanceForm(prev => ({ ...prev, amount: 0, action: 'SET' }));
    } catch (e: any) {
      setError(e.message);
    }
  }

  function generateCalendar() {
    const firstDay = new Date(calYear, calMonth - 1, 1);
    const lastDay = new Date(calYear, calMonth, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();

    const days: any[] = [];

    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ date: new Date(calYear, calMonth - 2, new Date(calYear, calMonth - 1, 0).getDate() - i).getDate(), isOtherMonth: true, leaves: [] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(calYear, calMonth - 1, i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = today.getDate() === i && today.getMonth() + 1 === calMonth && today.getFullYear() === calYear;

      const dayLeaves = calendarRequests.filter(lr => {
        const start = new Date(lr.startDate);
        const end = new Date(lr.endDate);
        return date >= start && date <= end;
      });

      days.push({ date: i, isWeekend, isToday, isOtherMonth: false, leaves: dayLeaves });
    }

    return days;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'APPROVED_BY_MANAGER': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  const calendarDays = generateCalendar();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const pendingRequests = requests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED_BY_MANAGER');
  const otherRequests = requests.filter(r => r.status !== 'PENDING' && r.status !== 'APPROVED_BY_MANAGER');

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 cursor-pointer" onClick={() => setError('')}>{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 cursor-pointer" onClick={() => setSuccess('')}>{success}</div>
      )}

      <div className="panel">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { key: 'requests', label: `Pending (${pendingRequests.length})` },
            { key: 'types', label: 'Leave Types' },
            { key: 'holidays', label: 'Holidays' },
            { key: 'calendar', label: 'Calendar' },
            { key: 'balances', label: 'Balances' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`rounded-lg px-4 py-2 text-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pending Approvals</h2>
            {pendingRequests.map(req => (
              <div key={req.id} className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{req.employee.name}</p>
                    <p className="text-sm">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-3 w-3 rounded" style={{ backgroundColor: req.leaveType.color }} />
                        {req.leaveType.name}
                      </span>
                      {' · '}{req.daysRequested} day{req.daysRequested > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </p>
                    {req.reason && <p className="text-sm text-slate-500">Reason: {req.reason}</p>}

                    {/* Conflict Widget */}
                    {conflicts[req.id] && (
                      <div className="mt-2 flex items-center gap-2 rounded-md bg-white p-2 text-xs shadow-sm border border-slate-200">
                        <div className={`h-2 w-2 rounded-full ${conflicts[req.id].absentCount / conflicts[req.id].totalTeamSize > 0.5 ? 'bg-red-500' :
                            conflicts[req.id].absentCount / conflicts[req.id].totalTeamSize > 0.2 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                        <span className="font-medium">Team Availability:</span>
                        <span>{conflicts[req.id].absentCount} of {conflicts[req.id].totalTeamSize} away</span>
                        {conflicts[req.id].absentCount > 1 && <span className="text-red-600 font-bold ml-1">(! Conflict)</span>}
                      </div>
                    )}

                    {req.status === 'APPROVED_BY_MANAGER' && (
                      <p className="mt-1 text-xs font-semibold text-blue-600">✓ Approved by Manager - Awaiting Admin Sign-off</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Comment (optional)"
                      value={approvalComment}
                      onChange={e => setApprovalComment(e.target.value)}
                      className="h-8 text-sm input"
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn-success px-3 py-1 text-sm"
                        onClick={() => processRequest(req.id, 'APPROVE')}
                        disabled={processingId === req.id}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-warning px-3 py-1 text-sm"
                        onClick={() => processRequest(req.id, 'REJECT')}
                        disabled={processingId === req.id}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-sm text-slate-500">No pending requests.</p>
            )}

            <h2 className="mt-6 border-t pt-4 text-lg font-semibold">All Requests</h2>
            <div className="space-y-2">
              {otherRequests.map(req => (
                <div key={req.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{req.employee.name}</span>
                      <span className="inline-flex items-center gap-1 text-sm">
                        <span className="h-3 w-3 rounded" style={{ backgroundColor: req.leaveType.color }} />
                        {req.leaveType.name}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    {' · '}{req.daysRequested} day{req.daysRequested > 1 ? 's' : ''}
                  </p>
                  {req.comments && <p className="text-xs text-slate-500">Note: {req.comments}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Leave Types</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingType(null);
                  setTypeForm({ name: '', color: '#3B82F6', description: '' });
                  setShowTypeForm(!showTypeForm);
                }}
              >
                {showTypeForm ? 'Cancel' : 'Add Type'}
              </button>
            </div>

            {showTypeForm && (
              <form onSubmit={saveType} className="grid grid-cols-1 gap-3 border-t pt-3 md:grid-cols-3">
                <input
                  placeholder="Name"
                  value={typeForm.name}
                  onChange={e => setTypeForm({ ...typeForm, name: e.target.value })}
                  required
                  className="input"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={typeForm.color}
                    onChange={e => setTypeForm({ ...typeForm, color: e.target.value })}
                    className="h-10 w-16"
                  />
                  <input
                    placeholder="Description"
                    value={typeForm.description}
                    onChange={e => setTypeForm({ ...typeForm, description: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-success">
                    {editingType ? 'Update' : 'Create'}
                  </button>
                  {editingType && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditingType(null);
                        setShowTypeForm(false);
                        setTypeForm({ name: '', color: '#3B82F6', description: '' });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="space-y-2">
              {leaveTypes.map(type => (
                <div key={type.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded" style={{ backgroundColor: type.color }} />
                    <div>
                      <span className="font-medium">{type.name}</span>
                      {!type.isActive && <span className="ml-2 text-xs text-slate-400">(inactive)</span>}
                      {type.description && <p className="text-xs text-slate-500">{type.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => {
                        setEditingType(type);
                        setTypeForm({ name: type.name, color: type.color, description: type.description || '' });
                        setShowTypeForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-warning text-xs"
                      onClick={() => toggleTypeActive(type)}
                    >
                      {type.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                      onClick={() => deleteType(type.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Holidays {calYear}</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingHoliday(null);
                  setHolidayForm({ name: '', date: '' });
                  setShowHolidayForm(!showHolidayForm);
                }}
              >
                {showHolidayForm ? 'Cancel' : 'Add Holiday'}
              </button>
            </div>

            {showHolidayForm && (
              <form onSubmit={saveHoliday} className="grid grid-cols-1 gap-3 border-t pt-3 md:grid-cols-3">
                <input
                  placeholder="Holiday name"
                  value={holidayForm.name}
                  onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  required
                  className="input"
                />
                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  required
                  className="input"
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn-success">
                    {editingHoliday ? 'Update' : 'Create'}
                  </button>
                  {editingHoliday && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditingHoliday(null);
                        setShowHolidayForm(false);
                        setHolidayForm({ name: '', date: '' });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {holidays.map(h => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="font-medium">{h.name}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() => {
                        setEditingHoliday(h);
                        setHolidayForm({ name: h.name, date: h.date.split('T')[0] });
                        setShowHolidayForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                      onClick={() => deleteHoliday(h.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {holidays.length === 0 && (
              <p className="text-sm text-slate-500">No holidays configured for this year.</p>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Team Calendar</h2>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary px-3 py-1"
                  onClick={() => setCurrentDate(new Date(calYear, calMonth - 2, 1))}
                >
                  ←
                </button>
                <span className="min-w-32 text-center font-medium">
                  {monthNames[calMonth - 1]} {calYear}
                </span>
                <button
                  className="btn-secondary px-3 py-1"
                  onClick={() => setCurrentDate(new Date(calYear, calMonth, 1))}
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-2 font-medium text-slate-500">{d}</div>
              ))}
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`min-h-20 rounded border p-1 ${day.isOtherMonth ? 'bg-slate-50 opacity-50' : 'bg-white'
                    } ${day.isToday ? 'border-emerald-400' : 'border-slate-200'} ${day.isWeekend ? 'bg-slate-50' : ''
                    }`}
                >
                  <div className={`text-sm ${day.isToday ? 'font-bold text-emerald-600' : ''}`}>
                    {day.date}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {day.leaves.slice(0, 3).map((lr: any, i: number) => (
                      <div
                        key={i}
                        className="truncate text-xs"
                        style={{ color: lr.leaveType.color }}
                        title={`${lr.employee.name}: ${lr.leaveType.name}`}
                      >
                        {lr.employee.name.split(' ')[0]}
                      </div>
                    ))}
                    {day.leaves.length > 3 && (
                      <div className="text-xs text-slate-400">+{day.leaves.length - 3} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {leaveTypes.filter(lt => lt.isActive).map(lt => (
                <div key={lt.id} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: lt.color }} />
                  <span>{lt.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Manage Leave Balances</h2>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary px-3 py-1"
                  onClick={() => setCurrentDate(new Date(calYear, calMonth - 2, 1))}
                >
                  ←
                </button>
                <span className="min-w-32 text-center font-medium">
                  {monthNames[calMonth - 1]} {calYear}
                </span>
                <button
                  className="btn-secondary px-3 py-1"
                  onClick={() => setCurrentDate(new Date(calYear, calMonth, 1))}
                >
                  →
                </button>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="input max-w-xs"
              >
                <option value="">Select Employee</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h3 className="font-semibold mb-3 text-sm text-slate-500 uppercase">Current Balances</h3>
                  {balances.length === 0 ? <p className="text-sm">No balances recorded for this month.</p> : (
                    <ul className="space-y-2">
                      {balances.map(b => (
                        <li key={b.id} className="flex justify-between items-center p-2 bg-white rounded border border-slate-100">
                          <span className="font-medium">{b.leaveType.name}</span>
                          <span className="font-bold text-lg">{b.balanceDays}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-sm text-slate-500 uppercase">Adjust Balance</h3>
                  <form onSubmit={updateBalance} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500">Leave Type</label>
                      <select
                        className="input w-full"
                        value={balanceForm.leaveTypeId}
                        onChange={e => setBalanceForm({ ...balanceForm, leaveTypeId: e.target.value })}
                        required
                      >
                        <option value="">Select Leave Type</option>
                        {leaveTypes.map(lt => (
                          <option key={lt.id} value={lt.id}>{lt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500">Action</label>
                        <select
                          className="input w-full"
                          value={balanceForm.action}
                          onChange={e => setBalanceForm({ ...balanceForm, action: e.target.value })}
                        >
                          <option value="SET">Set To</option>
                          <option value="CREDIT">Credit (+)</option>
                          <option value="DEBIT">Debit (-)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Amount (Days)</label>
                        <input
                          type="number"
                          step="0.5"
                          className="input w-full"
                          value={balanceForm.amount}
                          onChange={e => setBalanceForm({ ...balanceForm, amount: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <button className="btn-primary w-full mt-2">Update Balance</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
