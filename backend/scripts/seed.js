/**
 * seed.js — populate MongoDB with realistic sample candidates.
 *
 * Usage:
 *   node scripts/seed.js            # Insert candidates (skips if already seeded)
 *   node scripts/seed.js --force    # Drop existing candidates and re-seed
 *   node scripts/seed.js --clear    # Drop all candidates without re-seeding
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import Candidate from '../src/models/Candidate.js'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not set in .env')
  process.exit(1)
}

const FORCE = process.argv.includes('--force')
const CLEAR = process.argv.includes('--clear')

const CANDIDATES = [
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 43210',
    position: 'Frontend Engineer',
    experience: 4,
    skills: ['React', 'TypeScript', 'CSS', 'Figma'],
    stage: 'Interview',
    source: 'LinkedIn',
    appliedAt: new Date('2026-10-01'),
    notes: 'Strong portfolio, good communication.',
  },
  {
    name: 'James Okafor',
    email: 'james.okafor@example.com',
    phone: '+234 801 234 5678',
    position: 'Backend Engineer',
    experience: 3,
    skills: ['Node.js', 'Express', 'MongoDB', 'Docker'],
    stage: 'Screening',
    source: 'Referral',
    appliedAt: new Date('2026-10-03'),
    notes: '',
  },
  {
    name: 'Sofia Reyes',
    email: 'sofia.reyes@example.com',
    phone: '+52 55 1234 5678',
    position: 'Product Designer',
    experience: 6,
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    stage: 'Offer',
    source: 'Company Website',
    appliedAt: new Date('2026-09-28'),
    notes: 'Exceptional design sensibility. Negotiating salary.',
  },
  {
    name: 'Liam Chen',
    email: 'liam.chen@example.com',
    phone: '+1 415 555 0102',
    position: 'Product Manager',
    experience: 5,
    skills: ['Roadmapping', 'Jira', 'SQL', 'Stakeholder Management'],
    stage: 'Applied',
    source: 'AngelList',
    appliedAt: new Date('2026-10-10'),
    notes: '',
  },
  {
    name: 'Aisha Patel',
    email: 'aisha.patel@example.com',
    phone: '+44 7700 900123',
    position: 'Data Analyst',
    experience: 3,
    skills: ['Python', 'SQL', 'Tableau', 'Excel'],
    stage: 'Hired',
    source: 'LinkedIn',
    appliedAt: new Date('2026-09-15'),
    notes: 'Start date confirmed: Nov 1.',
  },
  {
    name: 'Marco Di Luca',
    email: 'marco.diluca@example.com',
    phone: '+39 02 1234 5678',
    position: 'DevOps Engineer',
    experience: 2,
    skills: ['AWS', 'Terraform', 'GitHub Actions', 'Linux'],
    stage: 'Rejected',
    source: 'Job Board',
    appliedAt: new Date('2026-10-05'),
    notes: 'Did not meet infrastructure experience requirement.',
  },
  {
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@example.com',
    phone: '+81 90 1234 5678',
    position: 'Frontend Engineer',
    experience: 2,
    skills: ['Vue.js', 'JavaScript', 'HTML', 'CSS'],
    stage: 'Screening',
    source: 'Referral',
    appliedAt: new Date('2026-10-08'),
    notes: '',
  },
  {
    name: 'Fatima Al-Hassan',
    email: 'fatima.alhassan@example.com',
    phone: '',
    position: 'QA Engineer',
    experience: 4,
    skills: ['Selenium', 'Jest', 'Cypress', 'JIRA'],
    stage: 'Applied',
    source: 'Company Website',
    appliedAt: new Date('2026-10-12'),
    notes: '',
  },
  {
    name: 'Noah Williams',
    email: 'noah.williams@example.com',
    phone: '+1 212 555 0198',
    position: 'Backend Engineer',
    experience: 6,
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis'],
    stage: 'Interview',
    source: 'LinkedIn',
    appliedAt: new Date('2026-10-02'),
    notes: 'Second round interview scheduled.',
  },
  {
    name: 'Camille Dubois',
    email: 'camille.dubois@example.com',
    phone: '+33 1 23 45 67 89',
    position: 'Product Designer',
    experience: 8,
    skills: ['Figma', 'Illustrator', 'Motion Design', 'UX Research'],
    stage: 'Hired',
    source: 'Referral',
    appliedAt: new Date('2026-09-20'),
    notes: 'Senior designer, started Oct 15.',
  },
  {
    name: 'Ethan Brooks',
    email: 'ethan.brooks@example.com',
    phone: '+1 646 555 0134',
    position: 'Data Analyst',
    experience: 1,
    skills: ['Python', 'Pandas', 'SQL'],
    stage: 'Screening',
    source: 'University Job Fair',
    appliedAt: new Date('2026-10-06'),
    notes: '',
  },
  {
    name: 'Ingrid Larsen',
    email: 'ingrid.larsen@example.com',
    phone: '+47 400 12 345',
    position: 'Frontend Engineer',
    experience: 5,
    skills: ['React', 'Next.js', 'TypeScript', 'GraphQL'],
    stage: 'Offer',
    source: 'LinkedIn',
    appliedAt: new Date('2026-09-30'),
    notes: 'Negotiating start date.',
  },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('🍃  MongoDB connected')

  if (CLEAR) {
    await Candidate.deleteMany({})
    console.log('🗑️   All candidates deleted.')
    await mongoose.disconnect()
    return
  }

  if (FORCE) {
    await Candidate.deleteMany({})
    console.log('🗑️   Cleared existing candidates.')
  } else {
    const count = await Candidate.countDocuments()
    if (count > 0) {
      console.log(`ℹ️   Database already has ${count} candidates. Use --force to re-seed.`)
      await mongoose.disconnect()
      return
    }
  }

  const inserted = await Candidate.insertMany(CANDIDATES)
  console.log(`✅  Seeded ${inserted.length} candidates.`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message)
  process.exit(1)
})
