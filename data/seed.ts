export interface Task {
  id: string;
  title: string;
  estimate: number;
  actual: number;
  done: boolean;
  timeBlock: string;
  goalId: string | null;
  priority: 'high' | 'medium' | 'low';
  aiNote?: string | null;
  subtasks?: { id: string; title: string; done: boolean }[];
}

export interface Goal {
  id: string;
  title: string;
  period: string;
  targetHours: number;
  spentHours: number;
  accent: 'sage' | 'terra' | 'lavender';
  dueIn: string;
}

export const SEED_TASKS: Task[] = [
  {
    id: 't1', title: 'Review onboarding flow with Maya',
    estimate: 45, actual: 0, done: false,
    timeBlock: '9:00 – 9:45', goalId: 'g1',
    priority: 'high', aiNote: 'Blocks 3 downstream tasks',
  },
  {
    id: 't2', title: 'Refactor token export script',
    estimate: 90, actual: 0, done: false,
    timeBlock: '10:15 – 11:45', goalId: 'g1',
    priority: 'high', aiNote: null,
    subtasks: [
      { id: 's1', title: 'Audit current token shape', done: true },
      { id: 's2', title: 'Draft new schema', done: false },
      { id: 's3', title: 'Migrate light theme', done: false },
      { id: 's4', title: 'Migrate dark theme', done: false },
    ],
  },
  {
    id: 't3', title: 'Lunch + walk',
    estimate: 45, actual: 0, done: false,
    timeBlock: '12:30 – 1:15', goalId: null,
    priority: 'low', aiNote: null,
  },
  {
    id: 't4', title: 'Read "Shape Up" — Ch. 4',
    estimate: 35, actual: 0, done: false,
    timeBlock: '2:00 – 2:35', goalId: 'g2',
    priority: 'medium', aiNote: null,
  },
  {
    id: 't0', title: 'Morning journal',
    estimate: 10, actual: 8, done: true,
    timeBlock: '8:15 – 8:25', goalId: null,
    priority: 'low', aiNote: null,
  },
];

export const SEED_GOALS: Goal[] = [
  { id: 'g1', title: 'Ship Q2 design system', period: 'This month', targetHours: 32, spentHours: 19.5, accent: 'sage',     dueIn: '12 days' },
  { id: 'g2', title: 'Read 4 books',          period: 'This month', targetHours: 16, spentHours: 11,   accent: 'terra',    dueIn: '12 days' },
  { id: 'g3', title: 'Run 20km / week',        period: 'This week',  targetHours: 3,  spentHours: 1.75, accent: 'lavender', dueIn: '4 days'  },
];

export const SEED_INSIGHTS = {
  streak: 12,
  weekHours: 14.2,
  weekTarget: 18,
  accuracy: [
    { day: 'M', est: 240, act: 280 },
    { day: 'T', est: 300, act: 265 },
    { day: 'W', est: 210, act: 240 },
    { day: 'T', est: 270, act: 250 },
    { day: 'F', est: 180, act: 195 },
    { day: 'S', est: 90,  act: 70  },
    { day: 'S', est: 120, act: 110 },
  ],
  focusByHour: [
    { h: '8',  v: 0.4  }, { h: '9',  v: 0.85 }, { h: '10', v: 0.95 },
    { h: '11', v: 0.7  }, { h: '12', v: 0.3  }, { h: '1',  v: 0.55 },
    { h: '2',  v: 0.8  }, { h: '3',  v: 0.6  }, { h: '4',  v: 0.45 },
    { h: '5',  v: 0.25 },
  ],
  bestWindow: '9:30 – 11:00',
};
