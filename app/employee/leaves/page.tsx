'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface LeaveType {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

interface LeaveRequest {
  id: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string | null;
  requestedAt: string;
  approver: { name: string } | null;
  comments: string | null;
}

interface Balance {
  leaveType: LeaveType;
  balance: number;
  used: number;
  remaining: number | null;
}

interface CalendarDay {
  date: number;
  isWeekend: boolean;
  isToday: boolean;
  isOtherMonth: boolean;
  leaves: LeaveRequest[];
}

export default function EmployeeLeavesPage() {
  const { data: session } = useSession();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [calendar, setCalendar] = useState<LeaveRequest[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchData();
  }, [year, month]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch leave types
      const ltRes = await fetch('/api/leave-types');
      if (ltRes.ok) setLeaveTypes(await ltRes.json());

      // Fetch requests
      const reqRes = await fetch('/api/employee/leaves');
      if (reqRes.ok) setRequests(await reqRes.json());

      // Fetch balances
      const balRes = await fetch(`/api/employee/leave-balance?year=${year}&month=${month}`);
      if (balRes.ok) setBalances(await balRes.json());

      // Fetch calendar
      const calRes = await fetch(`/api/employee/leave-calendar?year=${year}&month=${month}`);
      if (calRes.ok) setCalendar(await calRes.json());
    } catch (e) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function generateCalendar(): CalendarDay[] {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();

    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isWeekend: false,
        isToday: false,
        isOtherMonth: true,
        leaves: []
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = today.getDate() === i && today.getMonth() + 1 === month && today.getFullYear() === year;

      const dateStr = date.toISOString().split('T')[0];
      const dayLeaves = calendar.filter(lr => {
        const start = new Date(lr.startDate);
        const end = new Date(lr.endDate);
        return date >= start && date <= end;
      });

      days.push({ date: i, isWeekend, isToday, isOtherMonth: false, leaves: dayLeaves });
    }

    return days;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingRequest ? '/api/employee/leaves' : '/api/employee/leaves';
      const method = editingRequest ? 'PUT' : 'POST';
      const body = editingRequest
        ? { ...formData, id: editingRequest.id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save leave request');
      }

      setSuccess(editingRequest ? 'Leave request updated!' : 'Leave request submitted!');
      setShowForm(false);
      setEditingRequest(null);
      setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;

    try {
      const res = await fetch(`/api/employee/leaves?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel');
      setSuccess('Leave request cancelled');
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function openEdit(request: LeaveRequest) {
    setEditingRequest(request);
    setFormData({
      leaveTypeId: request.leaveTypeId,
      startDate: request.startDate.split('T')[0],
      endDate: request.endDate.split('T')[0],
      reason: request.reason || ''
    });
    setShowForm(true);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  const calendarDays = generateCalendar();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>
      )}

      {/* Balance Display */}
      <div className="panel">
        <h2 className="mb-4">Leave Balance ({monthNames[month - 1]} {year})</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {balances.map(b => (
            <div key={b.leaveType.id} className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded" style={{ backgroundColor: b.leaveType.color }} />
                <span className="font-medium">{b.leaveType.name}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-slate-500">Total</p>
                  <p className="font-semibold">{b.balance}</p>
                </div>
                <div>
                  <p className="text-slate-500">Used</p>
                  <p className="font-semibold">{b.used}</p>
                </div>
                <div>
                  <p className="text-slate-500">Left</p>
                  <p className="font-semibold">{b.remaining === null ? '∞' : b.remaining}</p>
                </div>
              </div>
            </div>
          ))}
          {balances.length === 0 && (
            <p className="col-span-3 text-sm text-slate-500">No leave types configured.</p>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="panel">
        <div className="mb-4 flex items-center justify-between">
          <h2>Leave Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary px-3 py-1"
              onClick={() => setCurrentDate(new Date(year, month - 2, 1))}
            >
              ←
            </button>
            <span className="min-w-32 text-center font-medium">
              {monthNames[month - 1]} {year}
            </span>
            <button
              className="btn-secondary px-3 py-1"
              onClick={() => setCurrentDate(new Date(year, month, 1))}
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
              className={`min-h-16 rounded border p-2 ${
                day.isOtherMonth ? 'bg-slate-50 opacity-50' : 'bg-white'
              } ${day.isToday ? 'border-emerald-400' : 'border-slate-200'} ${
                day.isWeekend ? 'bg-slate-50' : ''
              }`}
            >
              <div className={`text-sm ${day.isToday ? 'font-bold text-emerald-600' : ''}`}>
                {day.date}
              </div>
              <div className="mt-1 space-y-0.5">
                {day.leaves.map((lr, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded"
                    style={{ backgroundColor: lr.leaveType.color }}
                    title={`${lr.leaveType.name}: ${lr.status}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {leaveTypes.map(lt => (
            <div key={lt.id} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: lt.color }} />
              <span>{lt.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded border border-slate-300" />
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Apply/Cancel Form */}
      <div className="panel">
        <div className="flex items-center justify-between">
          <h2>My Leave Requests</h2>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingRequest(null);
              setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Cancel' : 'Apply Leave'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 md:grid-cols-2">
            <div>
              <label className="input-label">Leave Type</label>
              <select
                value={formData.leaveTypeId}
                onChange={e => setFormData({ ...formData, leaveTypeId: e.target.value })}
                required
              >
                <option value="">Select type</option>
                {leaveTypes.map(lt => (
                  <option key={lt.id} value={lt.id}>{lt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                required
                min={formData.startDate}
              />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">Reason (optional)</label>
              <input
                type="text"
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Brief reason for leave"
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="btn-success">
                {editingRequest ? 'Update Request' : 'Submit Request'}
              </button>
              {editingRequest && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingRequest(null);
                    setShowForm(false);
                    setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        )}

        {/* Request List */}
        <div className="mt-4 space-y-3">
          {requests.map(req => (
            <div key={req.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: req.leaveType.color }} />
                  <div>
                    <p className="font-medium">
                      {req.leaveType.name} ({req.daysRequested} day{req.daysRequested > 1 ? 's' : ''})
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </p>
                    {req.reason && <p className="text-sm text-slate-500 mt-1">Reason: {req.reason}</p>}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(req.status)}`}>
                  {req.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                <span>Requested: {new Date(req.requestedAt).toLocaleDateString()}</span>
                {req.approver && <span>By: {req.approver.name}</span>}
                {req.comments && <span className="text-slate-600">Note: {req.comments}</span>}
              </div>
              {req.status === 'PENDING' && (
                <div className="mt-3 flex gap-2">
                  <button className="btn-secondary text-xs" onClick={() => openEdit(req)}>
                    Edit
                  </button>
                  <button className="btn-warning text-xs" onClick={() => handleCancel(req.id)}>
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          ))}
          {requests.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No leave requests yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
