/**
 * MOCK DATA — Phase 1 placeholder only.
 * Replace these with API responses in Phase 2.
 * All data is clearly labelled as temporary.
 */

export const STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected',
]

export const POSITIONS = [
  'Frontend Engineer',
  'Backend Engineer',
  'Product Designer',
  'Product Manager',
  'Data Analyst',
  'DevOps Engineer',
  'QA Engineer',
]

/** @type {Array<{id:string, name:string, email:string, position:string, stage:string, appliedAt:string, rating:number|null}>} */
export const mockCandidates = [
  {
    id: 'c-001',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    position: 'Frontend Engineer',
    stage: 'Interview',
    appliedAt: '2026-10-01',
    rating: 4,
  },
  {
    id: 'c-002',
    name: 'James Okafor',
    email: 'james.okafor@example.com',
    position: 'Backend Engineer',
    stage: 'Screening',
    appliedAt: '2026-10-03',
    rating: 3,
  },
  {
    id: 'c-003',
    name: 'Sofia Reyes',
    email: 'sofia.reyes@example.com',
    position: 'Product Designer',
    stage: 'Offer',
    appliedAt: '2026-09-28',
    rating: 5,
  },
  {
    id: 'c-004',
    name: 'Liam Chen',
    email: 'liam.chen@example.com',
    position: 'Product Manager',
    stage: 'Applied',
    appliedAt: '2026-10-10',
    rating: null,
  },
  {
    id: 'c-005',
    name: 'Aisha Patel',
    email: 'aisha.patel@example.com',
    position: 'Data Analyst',
    stage: 'Hired',
    appliedAt: '2026-09-15',
    rating: 5,
  },
  {
    id: 'c-006',
    name: 'Marco Di Luca',
    email: 'marco.diluca@example.com',
    position: 'DevOps Engineer',
    stage: 'Rejected',
    appliedAt: '2026-10-05',
    rating: 2,
  },
  {
    id: 'c-007',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@example.com',
    position: 'Frontend Engineer',
    stage: 'Screening',
    appliedAt: '2026-10-08',
    rating: 4,
  },
  {
    id: 'c-008',
    name: 'Fatima Al-Hassan',
    email: 'fatima.alhassan@example.com',
    position: 'QA Engineer',
    stage: 'Applied',
    appliedAt: '2026-10-12',
    rating: null,
  },
  {
    id: 'c-009',
    name: 'Noah Williams',
    email: 'noah.williams@example.com',
    position: 'Backend Engineer',
    stage: 'Interview',
    appliedAt: '2026-10-02',
    rating: 3,
  },
  {
    id: 'c-010',
    name: 'Camille Dubois',
    email: 'camille.dubois@example.com',
    position: 'Product Designer',
    stage: 'Hired',
    appliedAt: '2026-09-20',
    rating: 5,
  },
  {
    id: 'c-011',
    name: 'Ethan Brooks',
    email: 'ethan.brooks@example.com',
    position: 'Data Analyst',
    stage: 'Screening',
    appliedAt: '2026-10-06',
    rating: 3,
  },
  {
    id: 'c-012',
    name: 'Ingrid Larsen',
    email: 'ingrid.larsen@example.com',
    position: 'Frontend Engineer',
    stage: 'Offer',
    appliedAt: '2026-09-30',
    rating: 4,
  },
]

/** Derived metrics from mock data — mirrors what a real API /metrics endpoint would return. */
export const mockMetrics = {
  totalCandidates: mockCandidates.length,
  activeCandidates: mockCandidates.filter(
    (c) => !['Hired', 'Rejected'].includes(c.stage)
  ).length,
  hiredThisMonth: mockCandidates.filter((c) => c.stage === 'Hired').length,
  interviewsScheduled: mockCandidates.filter((c) => c.stage === 'Interview').length,
}

/** Stage distribution for the bar chart. */
export const mockStageDistribution = STAGES.map((stage) => ({
  stage,
  count: mockCandidates.filter((c) => c.stage === stage).length,
}))

/** Applications over the last 6 months (simulated trend). */
export const mockApplicationTrend = [
  { month: 'May',  applications: 12, hired: 1 },
  { month: 'Jun',  applications: 18, hired: 2 },
  { month: 'Jul',  applications: 15, hired: 3 },
  { month: 'Aug',  applications: 22, hired: 2 },
  { month: 'Sep',  applications: 29, hired: 4 },
  { month: 'Oct',  applications: 12, hired: 2 },
]

/** Returns a recent subset for the dashboard table. */
export function getRecentCandidates(limit = 6) {
  return [...mockCandidates]
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    .slice(0, limit)
}
