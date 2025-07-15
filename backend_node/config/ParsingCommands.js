import nlp from 'compromise'

// You can expand these lists as you add more devices/rooms
const deviceKeywords = ['lamp', 'light', 'plug', 'plus', 'tv', 'television'];
const roomKeywords = ['living room', 'bedroom', 'kitchen', 'bathroom', 'office', 'lounge', 'salon'];

function parseCommand(text) {
  const doc = nlp(text.toLowerCase());

  // Simple intent detection
  let intent = null;
  if (text.match(/\b(turn|switch) on\b/)) intent = 'turn_on';
  if (text.match(/\b(turn|switch) off\b/)) intent = 'turn_off';

  // Device extraction (longest match first, for 'living room lamp')
  let device = null;
  for (let d of deviceKeywords.sort((a,b) => b.length - a.length)) {
    if (doc.has(d)) {
      device = d;
      break;
    }
  }

  // Room extraction
  let room = null;
  for (let r of roomKeywords.sort((a,b) => b.length - a.length)) {
    if (doc.has(r)) {
      room = r;
      break;
    }
  }

  return { intent, device, room };
}

// === Test Cases ===
const tests = [
  'Turn on the living room lamp',
  'Switch off the plug in the kitchen',
  'Turn on the tv',
  'Turn off bedroom light',
  'Turn on plus',
  'Switch on the bathroom lamp'
];

for (const t of tests) {
  console.log(`"${t}" =>`, parseCommand(t));
}
