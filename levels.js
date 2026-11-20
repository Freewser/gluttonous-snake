const LEVELS = [
  {
    id: 1,
    name: '草原初征',
    icon: '🌿',
    food: '🍎',
    target: 8,
    startInterval: 160,
    minInterval: 100,
    step: 10,
    starTimes: [60, 40],
    gen: { count: 10, style: 'scatter', sym: false },
    theme: {
      board: '#0d1a12',
      checker: 'rgba(255,255,255,0.015)',
      grid: 'rgba(255,255,255,0.045)',
      head: '#86efac',
      tail: '#166534',
      obstacle: '#3f6212',
      emoji: ''
    }
  },
  {
    id: 2,
    name: '森林小径',
    icon: '🌲',
    food: '🫐',
    target: 8,
    startInterval: 155,
    minInterval: 95,
    step: 10,
    starTimes: [65, 42],
    gen: { count: 16, style: 'scatter', sym: false },
    theme: {
      board: '#0c1a10',
      checker: 'rgba(255,255,255,0.015)',
      grid: 'rgba(255,255,255,0.045)',
      head: '#86efac',
      tail: '#14532d',
      obstacle: '#14532d',
      emoji: '🌲'
    }
  },
  {
    id: 3,
    name: '沙漠遗迹',
    icon: '🏜️',
    food: '🌵',
    target: 9,
    startInterval: 150,
    minInterval: 90,
    step: 10,
    starTimes: [70, 45],
    gen: { count: 18, style: 'cluster', sym: false },
    theme: {
      board: '#1a140c',
      checker: 'rgba(255,255,255,0.015)',
      grid: 'rgba(255,255,255,0.05)',
      head: '#fde047',
      tail: '#b45309',
      obstacle: '#92400e',
      emoji: '🗿'
    }
  },
  {
    id: 4,
    name: '冰川湖面',
    icon: '🧊',
    food: '🐟',
    target: 9,
    startInterval: 150,
    minInterval: 88,
    step: 9,
    starTimes: [70, 45],
    gen: { count: 20, style: 'cluster', sym: false },
    theme: {
      board: '#0b1620',
      checker: 'rgba(255,255,255,0.02)',
      grid: 'rgba(255,255,255,0.055)',
      head: '#a5f3fc',
      tail: '#0284c7',
      obstacle: '#0369a1',
      emoji: '🧊'
    }
  },
  {
    id: 5,
    name: '熔岩洞穴',
    icon: '🌋',
    food: '🔥',
    target: 10,
    startInterval: 145,
    minInterval: 85,
    step: 9,
    starTimes: [75, 48],
    gen: { count: 26, style: 'line', sym: false },
    theme: {
      board: '#180c0c',
      checker: 'rgba(255,255,255,0.018)',
      grid: 'rgba(255,255,255,0.05)',
      head: '#fed7aa',
      tail: '#ea580c',
      obstacle: '#7f1d1d',
      emoji: '🌋'
    }
  },
  {
    id: 6,
    name: '深海珊瑚',
    icon: '🪸',
    food: '🦐',
    target: 10,
    startInterval: 145,
    minInterval: 82,
    step: 9,
    starTimes: [75, 48],
    gen: { count: 30, style: 'cluster', sym: false },
    theme: {
      board: '#081820',
      checker: 'rgba(255,255,255,0.02)',
      grid: 'rgba(255,255,255,0.055)',
      head: '#67e8f9',
      tail: '#0e7490',
      obstacle: '#155e75',
      emoji: '🪸'
    }
  },
  {
    id: 7,
    name: '霓虹迷宫',
    icon: '💜',
    food: '⚡',
    target: 11,
    startInterval: 140,
    minInterval: 80,
    step: 8,
    starTimes: [80, 50],
    gen: { count: 32, style: 'line', sym: true },
    theme: {
      board: '#12081f',
      checker: 'rgba(255,255,255,0.02)',
      grid: 'rgba(255,255,255,0.06)',
      head: '#67e8f9',
      tail: '#a21caf',
      obstacle: '#6d28d9',
      emoji: '🔷'
    }
  },
  {
    id: 8,
    name: '古堡回廊',
    icon: '🏰',
    food: '🧀',
    target: 11,
    startInterval: 140,
    minInterval: 78,
    step: 8,
    starTimes: [80, 50],
    gen: { count: 40, style: 'mixed', sym: true },
    theme: {
      board: '#16130f',
      checker: 'rgba(255,255,255,0.018)',
      grid: 'rgba(255,255,255,0.05)',
      head: '#fcd34d',
      tail: '#b45309',
      obstacle: '#57534e',
      emoji: '🧱'
    }
  },
  {
    id: 9,
    name: '樱花庭院',
    icon: '🌸',
    food: '🍒',
    target: 12,
    startInterval: 135,
    minInterval: 75,
    step: 8,
    starTimes: [85, 52],
    gen: { count: 22, style: 'scatter', sym: true },
    theme: {
      board: '#1b1016',
      checker: 'rgba(255,255,255,0.02)',
      grid: 'rgba(255,255,255,0.055)',
      head: '#f9a8d4',
      tail: '#be185d',
      obstacle: '#9d174d',
      emoji: '🌸'
    }
  },
  {
    id: 10,
    name: '矿山洞穴',
    icon: '⛏️',
    food: '🥕',
    target: 12,
    startInterval: 130,
    minInterval: 72,
    step: 8,
    starTimes: [85, 52],
    gen: { count: 30, style: 'mixed', sym: false },
    theme: {
      board: '#101418',
      checker: 'rgba(255,255,255,0.018)',
      grid: 'rgba(255,255,255,0.05)',
      head: '#fbbf24',
      tail: '#b45309',
      obstacle: '#475569',
      emoji: '🪨'
    }
  },
  {
    id: 11,
    name: '星空驿站',
    icon: '🔭',
    food: '⭐',
    target: 13,
    startInterval: 130,
    minInterval: 70,
    step: 7,
    starTimes: [90, 55],
    gen: { count: 26, style: 'line', sym: true },
    theme: {
      board: '#05070f',
      checker: 'rgba(255,255,255,0.02)',
      grid: 'rgba(255,255,255,0.06)',
      head: '#c4b5fd',
      tail: '#7c3aed',
      obstacle: '#334155',
      emoji: '☄️'
    }
  },
  {
    id: 12,
    name: '终极试炼',
    icon: '👑',
    food: '🍰',
    target: 14,
    startInterval: 125,
    minInterval: 68,
    step: 7,
    starTimes: [95, 58],
    gen: { count: 46, style: 'mixed', sym: true },
    theme: {
      board: '#120a0c',
      checker: 'rgba(255,255,255,0.02)',
      grid: 'rgba(255,255,255,0.06)',
      head: '#fda4af',
      tail: '#e11d48',
      obstacle: '#9a3412',
      emoji: '🔶'
    }
  },
];
