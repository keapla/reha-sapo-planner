import { Therapist, Patient, ScheduleEntry, ScheduleResult, RoleType, TIME_SLOTS } from '../types';

/**
 * Calculates the mean, variance and standard deviation of therapist workloads.
 */
export function calculateWorkloadStats(
  therapists: Therapist[],
  entries: ScheduleEntry[]
) {
  const counts = therapists.map(t => {
    const assignedCount = entries.filter(e => e.therapistId === t.id).length;
    return {
      therapistId: t.id,
      therapistName: t.name,
      role: t.role,
      assignedCount
    };
  });

  const numTherapists = therapists.length;
  if (numTherapists === 0) {
    return { stats: [], variance: 0, stdDev: 0 };
  }

  const sum = counts.reduce((acc, curr) => acc + curr.assignedCount, 0);
  const mean = sum / numTherapists;

  const varianceSum = counts.reduce((acc, curr) => acc + Math.pow(curr.assignedCount - mean, 2), 0);
  const variance = varianceSum / numTherapists;
  const stdDev = Math.sqrt(variance);

  return {
    stats: counts,
    variance,
    stdDev
  };
}

/**
 * Checks if a specific slot is during a therapist's 60-min continuous break.
 * A break takes 3 consecutive slots (60 minutes) starting at breakStartSlot.
 */
export function isTherapistOnBreak(therapist: Therapist, slot: number): boolean {
  return slot >= therapist.breakStartSlot && slot < therapist.breakStartSlot + 3;
}

/**
 * Validates a schedule (both automatically generated and manually modified).
 * Returns hard violations, soft violations, stats, and scores.
 */
export function validateSchedule(
  entries: ScheduleEntry[],
  therapists: Therapist[],
  patients: Patient[]
): ScheduleResult {
  const hardViolations: string[] = [];
  const softViolations: string[] = [];

  const therapistMap = new Map<string, Therapist>(therapists.map(t => [t.id, t]));
  const patientMap = new Map<string, Patient>(patients.map(p => [p.id, p]));

  // Track double bookings
  // key: therapistId-slot, value: list of entries
  const therapistSlotMap = new Map<string, ScheduleEntry[]>();
  // key: patientId-slot, value: list of entries
  const patientSlotMap = new Map<string, ScheduleEntry[]>();

  for (const entry of entries) {
    const tKey = `${entry.therapistId}-${entry.slot}`;
    if (!therapistSlotMap.has(tKey)) therapistSlotMap.set(tKey, []);
    therapistSlotMap.get(tKey)!.push(entry);

    const pKey = `${entry.patientId}-${entry.slot}`;
    if (!patientSlotMap.has(pKey)) patientSlotMap.set(pKey, []);
    patientSlotMap.get(pKey)!.push(entry);
  }

  // Check therapist constraints
  for (const [key, list] of therapistSlotMap.entries()) {
    const [therapistId, slotStr] = key.split('-');
    const slot = parseInt(slotStr, 10);
    const therapist = therapistMap.get(therapistId);
    if (!therapist) continue;

    const timeLabel = TIME_SLOTS[slot]?.timeRange || `枠${slot}`;

    // 1. Double booking
    if (list.length > 1) {
      hardViolations.push(
        `療法士重複: ${therapist.name} が ${timeLabel} に複数の患者 (${list.map(e => patientMap.get(e.patientId)?.name || e.patientId).join(', ')}) を担当しています。`
      );
    }

    // 2. Break time overlap
    if (isTherapistOnBreak(therapist, slot)) {
      hardViolations.push(
        `休憩時間重複: ${therapist.name} の休憩時間 (${TIME_SLOTS[therapist.breakStartSlot].timeRange.split(' - ')[0]} - ${TIME_SLOTS[therapist.breakStartSlot + 2].timeRange.split(' - ')[1]}) に、患者 ${patientMap.get(list[0].patientId)?.name || list[0].patientId} の予定が割り当てられています。`
      );
    }

    // 3. Busy slots overlap
    if (therapist.busySlots.includes(slot)) {
      hardViolations.push(
        `業務外時間重複: ${therapist.name} は ${timeLabel} が業務外/時間外ですが、予定が割り当てられています。`
      );
    }

    // 4. Specialty / Role mismatch
    for (const e of list) {
      if (therapist.role !== e.role) {
        hardViolations.push(
          `資格不一致: ${therapist.name} (${therapist.role}) が ${timeLabel} に ${e.role} のリハビリを担当しています。`
        );
      }
    }
  }

  // Check therapist total units (pastUnits + assigned <= 324 units, which is 108 hours)
  for (const therapist of therapists) {
    const past = therapist.pastUnits || 0;
    const assigned = entries.filter(e => e.therapistId === therapist.id).length;
    const totalUnits = past + assigned;
    const totalHours = (totalUnits * 20) / 60;
    if (totalHours > 108) {
      hardViolations.push(
        `108時間上限超過: ${therapist.name} の総勤務時間（過去: ${past}単位 ＋ 本日: ${assigned}単位 ＝ 計 ${totalUnits}単位）が ${totalHours.toFixed(1)}時間 となり、上限の108時間（324単位）を超えています。`
      );
    }
  }

  // Check patient constraints (double bookings, NG combinations)
  for (const [key, list] of patientSlotMap.entries()) {
    const [patientId, slotStr] = key.split('-');
    const slot = parseInt(slotStr, 10);
    const patient = patientMap.get(patientId);
    if (!patient) continue;

    const timeLabel = TIME_SLOTS[slot]?.timeRange || `枠${slot}`;

    // 1. Patient Double Booking
    if (list.length > 1) {
      hardViolations.push(
        `患者重複: ${patient.name} が ${timeLabel} に複数の予定 (${list.map(e => therapistMap.get(e.therapistId)?.name || e.therapistId).join(', ')}) を入れられています。`
      );
    }

    // 2. NG Combinations
    for (const e of list) {
      if (patient.ngTherapistIds.includes(e.therapistId)) {
        const therapist = therapistMap.get(e.therapistId);
        hardViolations.push(
          `NG療法士重複: 患者 ${patient.name} にNG指定されている ${therapist?.name || e.therapistId} が担当に割り当てられています。`
        );
      }
    }
  }

  // Check patient order fulfillment
  // Compare assigned entries with actual orders
  const unassignedOrders: { patientId: string; role: RoleType; count: number }[] = [];
  for (const patient of patients) {
    const roles: RoleType[] = ['PT', 'OT', 'ST'];
    for (const r of roles) {
      const orderedCount = patient.orders[r];
      if (orderedCount > 0) {
        const assignedCount = entries.filter(e => e.patientId === patient.id && e.role === r).length;
        if (assignedCount < orderedCount) {
          unassignedOrders.push({
            patientId: patient.id,
            role: r,
            count: orderedCount - assignedCount
          });
        } else if (assignedCount > orderedCount) {
          hardViolations.push(
            `オーダー超過: ${patient.name} は ${r} のオーダーが ${orderedCount}枠 ですが、${assignedCount}枠 割り当てられています。`
          );
        }
      }
    }
  }

  // Check soft constraints: rehab intervals (at least 40 mins / 2 slots gap)
  // For each patient, check their sessions sorted by slot
  for (const patient of patients) {
    const pEntries = entries.filter(e => e.patientId === patient.id).sort((a, b) => a.slot - b.slot);
    for (let i = 0; i < pEntries.length - 1; i++) {
      const curr = pEntries[i];
      const next = pEntries[i + 1];
      const gap = next.slot - curr.slot - 1;
      
      if (gap < 2) {
        const gapMins = (gap + 1) * 20;
        const currTime = TIME_SLOTS[curr.slot].timeRange;
        const nextTime = TIME_SLOTS[next.slot].timeRange;
        softViolations.push(
          `間隔不足: ${patient.name} のリハビリ (${curr.role} @ ${currTime.split(' - ')[0]} と ${next.role} @ ${nextTime.split(' - ')[0]}) の間隔が ${gapMins}分（必要な間隔: 40分以上）しかありません。`
        );
      }
    }
  }

  // Workload statistics
  const { stats, variance, stdDev } = calculateWorkloadStats(therapists, entries);

  // Combine penalties to calculate final objective score
  // We want to avoid unassigned orders at all costs (infinite or massive penalty)
  // Hard violations are forbidden, let's heavily penalize them too.
  // Soft violations carry a smaller penalty (e.g., 100 points per violation)
  // Variance is multiplied by 500 to keep it in a similar magnitude and guide the solver.
  const unassignedPenalty = unassignedOrders.reduce((sum, order) => sum + order.count * 10000, 0);
  const hardPenalty = hardViolations.length * 5000;
  const softPenalty = softViolations.length * 100;
  const variancePenalty = variance * 1000;

  const score = unassignedPenalty + hardPenalty + softPenalty + variancePenalty;

  return {
    entries,
    hardViolations,
    softViolations,
    unassignedOrders,
    therapistStats: stats,
    loadVariance: variance,
    loadStdDev: stdDev,
    score
  };
}

/**
 * Main Automatic Scheduling Optimizer.
 * Employs a randomized greedy algorithm with smart heuristics, run multiple times to find the optimal result.
 */
export function generateOptimalSchedule(
  therapists: Therapist[],
  patients: Patient[],
  onProgress?: (progress: number, bestScore: number) => void
): ScheduleResult {
  let bestEntries: ScheduleEntry[] = [];
  let bestScore = Infinity;
  let bestResult: ReturnType<typeof validateSchedule> | null = null;

  const maxRestarts = 40; // Quick but effective within standard CPU limits
  
  // Extract all individual orders that need to be scheduled
  // Structure: { patientId, role, priority }
  interface OrderItem {
    patientId: string;
    role: RoleType;
    difficulty: number; // calculated heuristic difficulty
  }

  const baseOrders: OrderItem[] = [];
  for (const patient of patients) {
    const totalOrders = patient.orders.PT + patient.orders.OT + patient.orders.ST;
    // Patient difficulty: more orders and more NG restrictions make them harder to schedule, so schedule them first!
    const difficulty = totalOrders * 3 + patient.ngTherapistIds.length * 5;

    for (let i = 0; i < patient.orders.PT; i++) {
      baseOrders.push({ patientId: patient.id, role: 'PT', difficulty });
    }
    for (let i = 0; i < patient.orders.OT; i++) {
      baseOrders.push({ patientId: patient.id, role: 'OT', difficulty });
    }
    for (let i = 0; i < patient.orders.ST; i++) {
      baseOrders.push({ patientId: patient.id, role: 'ST', difficulty });
    }
  }

  // Pre-filter therapists by role for instant access
  const therapistsByRole: Record<RoleType, Therapist[]> = {
    PT: therapists.filter(t => t.role === 'PT'),
    OT: therapists.filter(t => t.role === 'OT'),
    ST: therapists.filter(t => t.role === 'ST')
  };

  const patientMap = new Map<string, Patient>(patients.map(p => [p.id, p]));

  for (let restart = 0; restart < maxRestarts; restart++) {
    // 1. Shuffle orders with a bias towards high-difficulty items (Priority constructive search)
    // Add small random noise to difficulty and sort by descending difficulty
    const sortedOrders = [...baseOrders].map(order => ({
      ...order,
      tempPriority: order.difficulty + Math.random() * 15
    })).sort((a, b) => b.tempPriority - a.tempPriority);

    const currentEntries: ScheduleEntry[] = [];

    // Track state inside this restart
    // therapistId -> Set of occupied slots
    const therapistBusy = new Map<string, Set<number>>();
    for (const t of therapists) {
      const busy = new Set<number>(t.busySlots);
      // Add break slots (3 slots)
      for (let b = 0; b < 3; b++) {
        busy.add(t.breakStartSlot + b);
      }
      therapistBusy.set(t.id, busy);
    }

    // patientId -> Set of occupied slots
    const patientBusy = new Map<string, Set<number>>();
    // patientId -> List of assigned slot indices (to calculate interval penalties)
    const patientAssignedSlots = new Map<string, number[]>();
    for (const p of patients) {
      patientBusy.set(p.id, new Set<number>());
      patientAssignedSlots.set(p.id, []);
    }

    // Track current therapist slot counts to optimize workload balance on the fly
    const therapistCounts = new Map<string, number>();
    for (const t of therapists) {
      therapistCounts.set(t.id, 0);
    }

    // Schedule each order greedily
    for (const order of sortedOrders) {
      const pId = order.patientId;
      const role = order.role;
      const patient = patientMap.get(pId)!;

      const candidates: {
        therapist: Therapist;
        slot: number;
        cost: number;
      }[] = [];

      const eligibleTherapists = therapistsByRole[role].filter(t => !patient.ngTherapistIds.includes(t.id));

      for (const t of eligibleTherapists) {
        const tBusy = therapistBusy.get(t.id)!;
        const pBusy = patientBusy.get(pId)!;
        const pSlots = patientAssignedSlots.get(pId)!;
        const currentCount = therapistCounts.get(t.id)!;
        const past = t.pastUnits || 0;

        // Ensure we strictly respect the 108 hours (324 units) hard limit
        if (past + currentCount >= 324) {
          continue;
        }

        // Try all slots (0 to 23)
        for (let slot = 0; slot < TIME_SLOTS.length; slot++) {
          if (tBusy.has(slot) || pBusy.has(slot)) {
            continue; // Hard constraint violated
          }

          // Calculate cost for this potential placement
          let cost = 0;

          // 1. Workload balance guide: prefer assigning to therapists with less work
          // Using a polynomial component (e.g. currentCount^2) strongly pushes for flat distribution!
          cost += Math.pow(currentCount, 2) * 50;

          // 2. Soft constraint: Interval check (keep sessions at least 40 mins apart)
          // For each existing session of this patient, check the slot gap
          for (const s of pSlots) {
            const gap = Math.abs(slot - s) - 1;
            if (gap === 0) {
              cost += 500; // Zero slots gap (adjacent) is heavily penalized
            } else if (gap === 1) {
              cost += 200; // 1 slot gap (20 mins) is moderately penalized
            }
          }

          // 3. Add tiny random factor to explore different paths across restarts
          cost += Math.random() * 5;

          candidates.push({ therapist: t, slot, cost });
        }
      }

      if (candidates.length > 0) {
        // Pick the best candidate (lowest cost)
        candidates.sort((a, b) => a.cost - b.cost);
        const best = candidates[0];

        // Book it!
        currentEntries.push({
          id: `${pId}-${role}-${best.slot}-${best.therapist.id}`,
          patientId: pId,
          therapistId: best.therapist.id,
          slot: best.slot,
          role: role
        });

        therapistBusy.get(best.therapist.id)!.add(best.slot);
        patientBusy.get(pId)!.add(best.slot);
        patientAssignedSlots.get(pId)!.push(best.slot);
        therapistCounts.set(best.therapist.id, therapistCounts.get(best.therapist.id)! + 1);
      }
    }

    // Evaluate the finished restart
    const result = validateSchedule(currentEntries, therapists, patients);

    // If we found a configuration with lower score, save it
    if (result.score < bestScore) {
      bestScore = result.score;
      bestEntries = currentEntries;
      bestResult = result;
    }

    if (onProgress) {
      onProgress(Math.round(((restart + 1) / maxRestarts) * 100), bestScore);
    }
  }

  // Return the best result found
  if (!bestResult) {
    // Fallback empty result
    return {
      entries: [],
      unassignedOrders: [],
      hardViolations: ["最適化アルゴリズムの実行に失敗しました。"],
      softViolations: [],
      therapistStats: [],
      loadVariance: 0,
      loadStdDev: 0,
      score: Infinity
    };
  }

  return {
    entries: bestEntries,
    unassignedOrders: bestResult.unassignedOrders,
    hardViolations: bestResult.hardViolations,
    softViolations: bestResult.softViolations,
    therapistStats: bestResult.therapistStats,
    loadVariance: bestResult.loadVariance,
    loadStdDev: bestResult.loadStdDev,
    score: bestScore
  };
}
