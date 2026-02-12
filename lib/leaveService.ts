import { prisma } from './prisma';
import { LeaveStatus, Prisma } from '@prisma/client';

// Helper to check if a date is a weekend
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// Calculate working days between two dates (excluding weekends and holidays)
export async function calculateWorkingDays(startDate: Date, endDate: Date): Promise<number> {
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const holidayDates = new Set(holidays.map(h => h.date.toISOString().split('T')[0]));

  let workingDays = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    if (!isWeekend(current) && !holidayDates.has(dateStr)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

// Get or create employee balance
export async function getOrCreateBalance(employeeId: string, leaveTypeId: string, year: number, month: number) {
  const balance = await prisma.employeeBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year_month: {
        employeeId,
        leaveTypeId,
        year,
        month
      }
    }
  });

  if (balance) return balance;

  // Get leave type to check if it's "Planned"
  const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });

  // Only "Planned" gets 2 days/month, others default to high number (effectively unlimited)
  const initialBalance = leaveType?.name === 'Planned' ? 2 : 999;

  return prisma.employeeBalance.create({
    data: {
      employeeId,
      leaveTypeId,
      year,
      month,
      balanceDays: initialBalance
    }
  });
}

// Create leave request
export async function createLeaveRequest(
  employeeId: string,
  leaveTypeId: string,
  startDate: Date,
  endDate: Date,
  reason?: string
) {
  // Validate dates
  if (startDate > endDate) {
    throw new Error('Start date cannot be after end date');
  }

  // Calculate working days
  const daysRequested = await calculateWorkingDays(startDate, endDate);

  if (daysRequested === 0) {
    throw new Error('No working days in selected date range (weekends/holidays only)');
  }

  // Get leave type
  const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveType) throw new Error('Invalid leave type');

  // Check balance for "Planned" leave
  if (leaveType.name === 'Planned') {
    const now = new Date();
    const balance = await getOrCreateBalance(employeeId, leaveTypeId, now.getFullYear(), now.getMonth() + 1);

    // Calculate already pending/approved days for this month
    const currentMonthRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        leaveTypeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        startDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }
    });

    const usedDays = currentMonthRequests.reduce((sum, req) => sum + req.daysRequested, 0);
    const remainingBalance = balance.balanceDays - usedDays;

    if (daysRequested > remainingBalance) {
      throw new Error(`Insufficient "Planned" leave balance. Available: ${remainingBalance}, Requested: ${daysRequested}`);
    }
  }

  // Create the leave request
  return prisma.leaveRequest.create({
    data: {
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      daysRequested,
      reason,
      status: LeaveStatus.PENDING
    },
    include: {
      leaveType: true,
      employee: { select: { id: true, name: true, email: true } }
    }
  });
}

// Update leave request (only if PENDING)
export async function updateLeaveRequest(
  requestId: string,
  employeeId: string,
  data: {
    leaveTypeId?: string;
    startDate?: Date;
    endDate?: Date;
    reason?: string;
  }
) {
  const existing = await prisma.leaveRequest.findFirst({
    where: { id: requestId, employeeId }
  });

  if (!existing) throw new Error('Leave request not found');
  if (existing.status !== LeaveStatus.PENDING) {
    throw new Error('Cannot modify leave request that is not in PENDING status');
  }

  const updateData: Prisma.LeaveRequestUpdateInput = {};

  // Recalculate days if dates changed
  if (data.startDate || data.endDate) {
    const start = data.startDate || existing.startDate;
    const end = data.endDate || existing.endDate;

    if (start > end) {
      throw new Error('Start date cannot be after end date');
    }

    const daysRequested = await calculateWorkingDays(start, end);
    if (daysRequested === 0) {
      throw new Error('No working days in selected date range (weekends/holidays only)');
    }

    updateData.startDate = start;
    updateData.endDate = end;
    updateData.daysRequested = daysRequested;
  }

  if (data.leaveTypeId) {
    const leaveType = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
    if (!leaveType) throw new Error('Invalid leave type');
    updateData.leaveType = { connect: { id: data.leaveTypeId } };
  }

  if (data.reason !== undefined) {
    updateData.reason = data.reason;
  }

  return prisma.leaveRequest.update({
    where: { id: requestId },
    data: updateData,
    include: {
      leaveType: true,
      employee: { select: { id: true, name: true, email: true } }
    }
  });
}

// Cancel leave request
export async function cancelLeaveRequest(requestId: string, employeeId: string) {
  const existing = await prisma.leaveRequest.findFirst({
    where: { id: requestId, employeeId }
  });

  if (!existing) throw new Error('Leave request not found');
  if (existing.status !== LeaveStatus.PENDING) {
    throw new Error('Can only cancel PENDING leave requests');
  }

  return prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: LeaveStatus.CANCELLED },
    include: {
      leaveType: true,
      employee: { select: { id: true, name: true, email: true } }
    }
  });
}

// Get employee leave requests
export async function getEmployeeLeaveRequests(employeeId: string, filters?: { status?: LeaveStatus; year?: number; month?: number }) {
  const where: Prisma.LeaveRequestWhereInput = { employeeId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.year || filters?.month) {
    where.startDate = {};
    if (filters.year) {
      where.startDate.gte = new Date(filters.year, (filters.month || 1) - 1, 1);
      where.startDate.lt = new Date(filters.year, (filters.month || 12), 1);
    }
  }

  return prisma.leaveRequest.findMany({
    where,
    include: {
      leaveType: true,
      approver: { select: { id: true, name: true, email: true } }
    },
    orderBy: { requestedAt: 'desc' }
  });
}

// Get employee leave calendar
export async function getEmployeeLeaveCalendar(employeeId: string, year: number, month: number) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const requests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      OR: [
        { startDate: { gte: startOfMonth, lte: endOfMonth } },
        { endDate: { gte: startOfMonth, lte: endOfMonth } },
        { AND: [{ startDate: { lte: startOfMonth } }, { endDate: { gte: endOfMonth } }] }
      ]
    },
    include: { leaveType: true }
  });

  return requests;
}

// Get employee balances
export async function getEmployeeBalances(employeeId: string, year: number, month: number) {
  const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });

  const balances = await Promise.all(
    leaveTypes.map(async (lt) => {
      const balance = await getOrCreateBalance(employeeId, lt.id, year, month);

      // Calculate used days
      const usedRequests = await prisma.leaveRequest.findMany({
        where: {
          employeeId,
          leaveTypeId: lt.id,
          status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
          startDate: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1)
          }
        }
      });

      const usedDays = usedRequests.reduce((sum, req) => sum + req.daysRequested, 0);
      const remaining = balance.balanceDays - usedDays;

      return {
        leaveType: lt,
        balance: balance.balanceDays,
        used: usedDays,
        remaining: lt.name === 'Planned' ? Math.max(0, remaining) : null // null = unlimited for Sick/Casual
      };
    })
  );

  return balances;
}

// Manager: Get pending requests for team
export async function getTeamPendingRequests(managerId: string) {
  const teamMembers = await prisma.user.findMany({
    where: { managerId, isActive: true }
  });

  const teamIds = teamMembers.map(tm => tm.id);

  return prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: teamIds },
      status: LeaveStatus.PENDING
    },
    include: {
      leaveType: true,
      employee: { select: { id: true, name: true, email: true } }
    },
    orderBy: { requestedAt: 'asc' }
  });
}

// Manager/Admin: Get team calendar
export async function getTeamCalendar(managerId: string | null, year: number, month: number) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const where: Prisma.LeaveRequestWhereInput = {
    status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
    OR: [
      { startDate: { gte: startOfMonth, lte: endOfMonth } },
      { endDate: { gte: startOfMonth, lte: endOfMonth } },
      { AND: [{ startDate: { lte: startOfMonth } }, { endDate: { gte: endOfMonth } }] }
    ]
  };

  if (managerId) {
    // For manager: show only their team
    const teamMembers = await prisma.user.findMany({
      where: { managerId, isActive: true },
      select: { id: true }
    });
    where.employeeId = { in: teamMembers.map(tm => tm.id) };
  }

  return prisma.leaveRequest.findMany({
    where,
    include: {
      leaveType: true,
      employee: { select: { id: true, name: true, email: true } }
    },
    orderBy: { startDate: 'asc' }
  });
}

// Approve/Reject leave request
export async function processLeaveRequest(
  requestId: string,
  action: 'APPROVE' | 'REJECT',
  approverId: string,
  comments?: string
) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { leaveType: true }
  });

  if (!request) throw new Error('Leave request not found');
  if (request.status !== LeaveStatus.PENDING) {
    throw new Error('Can only process PENDING leave requests');
  }

  // For Planned leave on approval, verify sufficient balance
  if (action === 'APPROVE' && request.leaveType.name === 'Planned') {
    const requestMonth = request.startDate.getMonth() + 1;
    const requestYear = request.startDate.getFullYear();
    const balance = await getOrCreateBalance(request.employeeId, request.leaveTypeId, requestYear, requestMonth);

    // Calculate already used days in that month (excluding this request)
    const otherRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        status: LeaveStatus.APPROVED,
        id: { not: requestId },
        startDate: {
          gte: new Date(requestYear, requestMonth - 1, 1),
          lt: new Date(requestYear, requestMonth, 1)
        }
      }
    });

    const usedDays = otherRequests.reduce((sum, req) => sum + req.daysRequested, 0);
    const available = balance.balanceDays - usedDays;

    if (request.daysRequested > available) {
      throw new Error(`Insufficient balance for approval. Available: ${available}, Required: ${request.daysRequested}`);
    }
  }

  return prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: action === 'APPROVE' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
      approverId,
      approvedAt: new Date(),
      comments: comments || null
    },
    include: {
      leaveType: true,
      employee: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true, email: true } }
    }
  });
}

// Admin: Get all leave requests
export async function getAllLeaveRequests(filters?: { status?: LeaveStatus; employeeId?: string }) {
  const where: Prisma.LeaveRequestWhereInput = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.employeeId) where.employeeId = filters.employeeId;

  return prisma.leaveRequest.findMany({
    where,
    include: {
      leaveType: true,
      employee: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true, email: true } }
    },
    orderBy: { requestedAt: 'desc' }
  });
}

// Monthly balance reset (call this on 1st of each month)
export async function resetMonthlyBalances(year: number, month: number) {
  const plannedLeaveType = await prisma.leaveType.findUnique({
    where: { name: 'Planned' }
  });

  if (!plannedLeaveType) return;

  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', isActive: true }
  });

  const results = await Promise.all(
    employees.map(employee =>
      prisma.employeeBalance.upsert({
        where: {
          employeeId_leaveTypeId_year_month: {
            employeeId: employee.id,
            leaveTypeId: plannedLeaveType.id,
            year,
            month
          }
        },
        update: { balanceDays: 2 },
        create: {
          employeeId: employee.id,
          leaveTypeId: plannedLeaveType.id,
          year,
          month,
          balanceDays: 2
        }
      })
    )
  );

  return results.length;
}
