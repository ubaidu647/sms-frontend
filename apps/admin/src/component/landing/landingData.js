// Content for the public landing page at school.mizenzo.com.
//
// Copy is adapted from the Mizenzo School page on mizenzo.com; prices and
// limits mirror sms-backend/src/scripts/plan-catalog.ts (the plans seeded into
// the system console). Change a price there and here together.

export const CONTACT = {
  phoneDisplay: '0310 9721647',
  phoneE164: '+923109721647',
  waNumber: '923109721647',
  email: 'mizenzosolutions@gmail.com',
  website: 'https://mizenzo.com',
};

/** WhatsApp deep link with a pre-filled message. */
export const wa = (message) =>
  `https://wa.me/${CONTACT.waNumber}?text=${encodeURIComponent(message)}`;

export const WA_DEMO = wa('Assalam-o-Alaikum Mizenzo, mujhe Mizenzo School ka free demo chahiye.');
export const WA_ENQUIRE = wa(
  'Assalam-o-Alaikum, mujhe Mizenzo School ke bare mein maloomat chahiye.',
);

/** Brand colours, matched to the logo and the school dashboard (#00918E teal, gold bulb). */
export const TONES = {
  teal: '#00918e',
  bright: '#00a8a4',
  deep: '#006360',
  gold: '#d99a00',
  green: '#16a34a',
};

/** The navbar's "Features" dropdown: one entry per headline module. */
export const NAV_DROP = [
  {
    icon: 'users',
    title: 'Parent portal',
    sub: 'Fees, attendance & results',
    tone: TONES.teal,
    href: '#new',
  },
  {
    icon: 'clipboard',
    title: 'Online admissions',
    sub: 'From enquiry to admitted',
    tone: TONES.gold,
    href: '#new',
  },
  {
    icon: 'wallet',
    title: 'Fees & vouchers',
    sub: 'Concessions, fines & ledgers',
    tone: TONES.deep,
    href: '#features',
  },
  {
    icon: 'clock',
    title: 'Attendance',
    sub: 'Students and staff',
    tone: TONES.bright,
    href: '#features',
  },
  {
    icon: 'chart',
    title: 'Exams & results',
    sub: 'Marks and result cards',
    tone: TONES.teal,
    href: '#features',
  },
  {
    icon: 'coins',
    title: 'Staff payroll',
    sub: 'Salary & payslips',
    tone: TONES.gold,
    href: '#features',
  },
  {
    icon: 'award',
    title: 'Certificates',
    sub: 'SLC, character — Urdu & English',
    tone: TONES.deep,
    href: '#new',
  },
  {
    icon: 'bus',
    title: 'Transport',
    sub: 'Routes, vehicles & fee',
    tone: TONES.bright,
    href: '#features',
  },
];

export const PORTALS = [
  {
    key: 'admin',
    title: 'School portal',
    who: 'Principal, admin, teachers, accountant and every staff role',
    href: '/signin',
    icon: 'layout',
  },
  {
    key: 'student',
    title: 'Student portal',
    who: 'Timetable, homework, attendance, results and fee vouchers',
    href: 'https://students.school.mizenzo.com',
    icon: 'school',
  },
  {
    key: 'parent',
    title: 'Parent portal',
    who: "Every child's fees, attendance, results and announcements in one login",
    href: 'https://parents.school.mizenzo.com',
    icon: 'users',
  },
  {
    key: 'mobile',
    title: 'Android app',
    who: 'The same school on the phone — for staff, students and parents',
    href: null,
    icon: 'smartphone',
  },
];

export const HERO_ICONS = [
  { icon: 'users', label: 'Student management' },
  { icon: 'coins', label: 'Staff & payroll' },
  { icon: 'clock', label: 'Attendance tracking' },
  { icon: 'wallet', label: 'Fees & vouchers' },
  { icon: 'chart', label: 'Exams & results' },
];

export const STATS = [
  { value: '30+', label: 'Working modules' },
  { value: '4', label: 'Apps — school, student, parent + Android' },
  { value: '3', label: 'Permission scopes — all, branch, own' },
  { value: 'PKR', label: 'Fees, vouchers and payroll' },
];

/** The newest modules, shown first because they are what sets us apart. */
export const WHATS_NEW = [
  {
    icon: 'users',
    title: 'Parent portal',
    body: 'Parents sign in once and see every child: fee vouchers, attendance, results, homework and announcements. Siblings sit under one login.',
  },
  {
    icon: 'clipboard',
    title: 'Online admissions',
    body: 'A public admission form per branch. Enquiries move from new → follow-up → test → admitted, and admitting enrols the student and raises the first voucher.',
  },
  {
    icon: 'award',
    title: 'Certificates in Urdu & English',
    body: 'School leaving, character, bonafide and fee clearance certificates, printed in English or Urdu. An SLC checks fees are clear first.',
  },
  {
    icon: 'book',
    title: 'Library',
    body: 'Books, issues and returns for students and staff, with a per-day late fine that lands on the next fee voucher by itself.',
  },
  {
    icon: 'box',
    title: 'Inventory & school shop',
    body: 'Stock, fixed assets and suppliers. Uniforms and books sold at the school shop are billed on the next fee voucher.',
  },
  {
    icon: 'calendar',
    title: 'Leave management',
    body: 'Student leave from the parent portal or the office, staff leave with yearly quotas. Approved leave is excused from attendance.',
  },
  {
    icon: 'trending',
    title: 'Year-end promotion',
    body: 'Promote whole classes in one go — fees, subjects, teachers and transport carry over, detained students stay back, and the old year closes.',
  },
  {
    icon: 'bank',
    title: 'Expenses, Profit & Loss — and full accounting',
    body: 'Every plan: expenses, other income, cash & bank and a monthly Profit & Loss. Premium: chart of accounts, journals, trial balance and balance sheet. Fees, salaries and purchases post themselves.',
  },
];

export const FEATURES = [
  {
    icon: 'school',
    title: 'Admissions & registration',
    body: 'From an enquiry to a registered student with a class, a section and a roll number. Records keep their full history instead of being overwritten.',
  },
  {
    icon: 'clock',
    title: 'Attendance — students and staff',
    body: 'Daily student attendance by class and section, and separate staff attendance that feeds straight into salary.',
  },
  {
    icon: 'book',
    title: 'Timetable & teaching assignments',
    body: 'Classes, subjects, periods and which teacher takes what — with clashes caught before Monday morning.',
  },
  {
    icon: 'chart',
    title: 'Exams & results',
    body: 'Exam schedules, marks entry and result cards a parent can actually read.',
  },
  {
    icon: 'wallet',
    title: 'Fees, vouchers & ledgers',
    body: 'Fee structures per class, vouchers, receipts, concessions and a live ledger per student. Defaulters are a list, not a search.',
  },
  {
    icon: 'coins',
    title: 'Staff, salary & payroll',
    body: 'Staff records, attendance-linked salary, allowances and deductions, with printable payslips.',
  },
  {
    icon: 'bus',
    title: 'Transport',
    body: 'Routes, vehicles and which student rides which route — with the transport fee on the same voucher.',
  },
  {
    icon: 'wa',
    title: 'Announcements & WhatsApp',
    body: 'Homework, announcements and WhatsApp messages to parents — on the channel families actually read.',
  },
];

export const SPLITS = [
  {
    eyebrow: 'Permissions',
    title: "A teacher's screen is the admin's screen — at their own scope.",
    body: 'Schools do not have a fixed set of five roles. They have a vice principal who also runs transport, an accountant covering two branches and a senior teacher who sees one section. So you create roles yourself, with exactly the actions they need.',
    checks: [
      ['Every action has a scope:', ' everything, one branch, or only their own records.'],
      [
        'Roles are data, not code.',
        ' Create "Section Head" on a Tuesday afternoon without waiting for us.',
      ],
      [
        'One school portal for every staff role,',
        " because a teacher's student list is the same screen — just narrower.",
      ],
      ['Students and parents get their own portals,', ' kept apart from staff.'],
      [
        'A super-admin console',
        ' handles schools, plans and billing, kept away from the people running the school.',
      ],
    ],
    panel: {
      title: 'Role · Senior Teacher (Branch 2)',
      rows: [
        { av: 'ST', title: 'Students', sub: 'Read and update', amt: 'Own sections', tone: 'info' },
        { av: 'AT', title: 'Attendance', sub: 'Mark and amend', amt: 'Own sections', tone: 'info' },
        { av: 'EX', title: 'Exams & marks', sub: 'Enter marks', amt: 'Branch', tone: 'ok' },
        {
          av: 'FE',
          title: 'Fees & ledger',
          sub: 'Not part of this role',
          amt: 'No access',
          tone: 'warn',
        },
      ],
    },
  },
  {
    eyebrow: 'Reaching parents',
    reversed: true,
    title: 'The message has to arrive where the family is.',
    body: 'A notice in a diary is a notice nobody read. Fee reminders, absence alerts, results and announcements go out on the channels parents actually check.',
    checks: [
      ['WhatsApp', ' for fee reminders, absence alerts and announcements.'],
      ['The parent portal and Android app', ' show fees, attendance and results live.'],
      ['Homework and announcements', ' go to one class, not the whole school.'],
      ['Every send is recorded,', ' so "we were never told" has an answer.'],
    ],
    panel: {
      title: 'Fee reminders · Class 8-B',
      rows: [
        {
          av: '28',
          title: 'Vouchers raised',
          sub: 'October · tuition + transport',
          amt: '1,68,000',
        },
        {
          av: '21',
          title: 'Paid',
          sub: 'Receipt issued automatically',
          amt: '1,26,000',
          tone: 'ok',
        },
        {
          av: '7',
          title: 'Outstanding',
          sub: 'WhatsApp reminder sent',
          amt: '42,000',
          tone: 'warn',
        },
        {
          av: '2',
          title: 'Concession applied',
          sub: 'Recorded, not deleted',
          amt: 'Sibling',
          tone: 'info',
        },
      ],
    },
  },
];

export const MODULES = [
  {
    title: 'Academics',
    items: [
      'Classes & sections',
      'Subjects',
      'Timetable',
      'Teaching assignments',
      'Exams & result cards',
      'Homework',
      'Attendance',
    ],
  },
  {
    title: 'People',
    items: [
      'Students',
      'Admissions & enquiries',
      'Staff',
      'Staff attendance',
      'Parents',
      'Roles & permissions',
    ],
  },
  {
    title: 'Money',
    items: [
      'Fee structures',
      'Vouchers & receipts',
      'Concessions & fines',
      'Student ledger',
      'Staff salary & payslips',
      'Expenses & other income',
      'Profit & Loss',
      'Accounting',
    ],
  },
  {
    title: 'Operations',
    items: [
      'Branches',
      'Transport',
      'Library',
      'Inventory & school shop',
      'Leave management',
      'Year-end promotion',
    ],
  },
  {
    title: 'Communication',
    items: ['Announcements', 'WhatsApp alerts', 'Certificates (Urdu & English)', 'Notifications'],
  },
  {
    title: 'Oversight',
    items: ['Dashboard', 'Reports', 'Defaulters list', 'Audit trail', 'School profile & settings'],
  },
];

// ─── Pricing (mirrors sms-backend/src/scripts/plan-catalog.ts) ──────────────

/** Every plan includes these core modules. */
export const CORE_INCLUDED = [
  'Students, classes & sections',
  'Student attendance',
  'Timetable & homework',
  'Exams & result cards',
  'Fees, vouchers & receipts',
  'Expenses, other income & cash/bank',
  'Profit & Loss report',
  'Announcements',
  'Year-end promotion',
  'Reports, roles & branches',
  'Parent & student portals + Android app',
];

/** Add-on modules, with their monthly price when a plan does not include them. */
export const ADDON_MODULES = [
  { key: 'certificates', label: 'Certificates (Urdu & English)', price: 300 },
  { key: 'admissions', label: 'Online admissions', price: 500 },
  { key: 'leave', label: 'Leave management', price: 400 },
  { key: 'staff-attendance', label: 'Staff attendance', price: 500 },
  { key: 'staff-salary', label: 'Staff salary & payslips', price: 800 },
  { key: 'whatsapp', label: 'WhatsApp alerts', price: 1000 },
  { key: 'transport', label: 'Transport', price: 700 },
  // The books are kept on every plan; this opens the accountant's screens.
  { key: 'accounting', label: 'Full accounting (ledger, balance sheet)', price: 1500 },
  { key: 'library', label: 'Library', price: 500 },
  { key: 'inventory', label: 'Inventory & school shop', price: 700 },
];

export const LAUNCH_OFFER = { maxSchools: 30, lockMonths: 12 };

/** Yearly = 10 × monthly (two months free). */
export const YEARLY_MULTIPLIER = 10;

export const PLANS = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'Small single-branch schools — fees, expenses & Profit/Loss',
    price: 2500,
    offerPrice: 1500,
    limits: { students: 300, branches: 1, staff: 25, sections: 15, storageGB: 2 },
    modules: ['certificates'],
  },
  {
    code: 'standard',
    name: 'Standard',
    description:
      'Medium schools — WhatsApp, payroll, admissions, transport, expenses & Profit/Loss',
    price: 5000,
    offerPrice: 3500,
    featured: true,
    limits: { students: 800, branches: 2, staff: 60, sections: 40, storageGB: 5 },
    modules: [
      'certificates',
      'admissions',
      'leave',
      'staff-attendance',
      'staff-salary',
      'whatsapp',
      'transport',
    ],
  },
  {
    code: 'premium',
    name: 'Premium',
    description:
      'Large schools and chains — everything, with full accounting: ledger, trial balance & balance sheet',
    price: 9000,
    offerPrice: 6500,
    limits: { students: 2000, branches: 5, staff: 150, sections: 100, storageGB: 15 },
    modules: ADDON_MODULES.map((m) => m.key),
  },
];

export const PLAN_LIMITS = [
  { key: 'students', label: 'students' },
  { key: 'branches', label: 'branches', one: 'branch' },
  { key: 'staff', label: 'staff accounts' },
  { key: 'sections', label: 'class sections' },
  { key: 'storageGB', label: 'GB file storage' },
];

export const FAQS = [
  {
    q: 'How much does it cost?',
    a: `Starter is Rs 2,500 a month, Standard Rs 5,000 and Premium Rs 9,000. The first ${LAUNCH_OFFER.maxSchools} schools get the launch price — Rs 1,500, Rs 3,500 and Rs 6,500 — locked for a full year. Paying yearly gives you two months free.`,
  },
  {
    q: 'Do Starter and Standard show our expenses and profit?',
    a: 'Yes. Every plan records expenses (bijli, kiraya, stationery…), other income and cash & bank balances, and shows a Profit & Loss report month by month — fees and salaries included. Premium adds full accounting for schools with an accountant: chart of accounts, journal vouchers, trial balance, balance sheet and period closing. Your books are kept from day one, so upgrading later loses nothing.',
  },
  {
    q: 'What if we grow past our plan?',
    a: 'Add more students, staff, sections, branches or storage as add-ons, or switch on a single module your plan does not include. When add-ons start costing more than the next plan, the next plan is simply cheaper.',
  },
  {
    q: "Can parents see their child's attendance and fees?",
    a: 'Yes — on the parent portal and the Android app, and through WhatsApp messages for fee reminders, absence alerts and announcements. A parent with three children sees all three under one login.',
  },
  {
    q: 'We run three campuses. Is that one system or three?',
    a: 'One. Branches are built in, staff can be limited to a single campus, and management sees both branch-level and combined figures.',
  },
  {
    q: 'Can we create our own roles, like a section head or a transport in-charge?',
    a: 'Yes, whenever you like. You pick the actions the role can perform and the scope it works at — everything, one branch, or only their own records.',
  },
  {
    q: 'Can we import our existing student data?',
    a: 'Yes. We import students, classes, fee structures and opening balances from your Excel sheets during setup.',
  },
  {
    q: 'Is there an online fee payment option?',
    a: 'Fees are collected at the school as today; the system issues the voucher, records the payment and sends the receipt and reminders. Parents see what is due on their portal.',
  },
];
