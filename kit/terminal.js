// The portfolio shell's commands: pure, no DOM. runCommand(line, { achievements }) -> { out, action?, arg? }.
// Anything with a side effect comes back as an action for kit/extras.js to perform.
// Copy is enhance.js's, verbatim, except: no email address as text, theme (the switcher is gone), and the
// two new commands (play, palette) appended to help.
// The world homepage has no #contact; its plain résumé section (#resume-h) holds the email link.
const CONTACT = '/index.html#resume-h';
const PAGES = { work: '/index.html', blog: '/blog.html', about: '/index.html', contact: CONTACT };

const HELP = `Commands:
  about     who I am
  work      selected projects
  skills    my stack
  hire      how to work with me
  contact   reach me
  email     copy my email
  resume    download CV
  blog      open the writing
  gh        my recent github repos
  theme x   jade|blue|violet|coral
  game      play the bug hunt
  achievements   what you have unlocked
  matrix    ...
  clear     wipe the screen
  play      play the bug hunt
  palette   the command palette`;

const SKILLS = `Go, TypeScript, JavaScript, PHP, Python, Java, Kotlin, Swift, C#
React, Next.js, Svelte, Node, Laravel, GraphQL, The Graph, Subsquid
Unity, Godot, Three.js, Phaser, React Native, Postgres, Mongo, Redis`;

const COMMANDS = {
  help: () => ({ out: HELP }),
  about: () => ({ out: 'Senior full-stack engineer, 12+ years, coding since age 7.\nShipped the web platform for a top-10 crypto, enterprise systems, DeFi, and apps with hundreds of thousands of installs.\nFully remote, available now.' }),
  whoami: () => ({ out: 'harman — senior full-stack / Web3 / AI engineer.' }),
  work: () => ({ out: "Shiba Inu, OpenSpeaker (Endeavor), GatheredHere, ElasticSwap, Koji (Gometa), Aftertutor.\nType the name or run 'open work' to see them." }),
  skills: () => ({ out: SKILLS }),
  stack: () => ({ out: SKILLS }),
  hire: () => ({ out: "Open to senior full-stack, Web3, or AI roles, fully remote.\nRun 'contact' or 'email'. Opening the hire page..." }),
  contact: () => ({ out: 'opening contact...', action: 'go', arg: CONTACT }),
  email: () => ({ out: 'Copied my email to your clipboard.', action: 'email' }),
  resume: () => ({ out: 'Opening resume...', action: 'open', arg: '/Harman-Kamboj-Resume.pdf' }),
  blog: () => ({ out: 'Opening the writing...', action: 'go', arg: PAGES.blog }),
  open: (arg) => (Object.hasOwn(PAGES, arg) ? { out: `opening ${arg}...`, action: 'go', arg: PAGES[arg] } : { out: 'usage: open work|blog|about|contact' }),
  gh: () => ({ out: 'fetching from github...', action: 'gh' }),
  theme: () => ({ out: "The felt only comes in one colourway now. Cosy, isn't it?" }),
  game: () => ({ out: 'Launching bug hunt...', action: 'bughunt' }),
  play: () => ({ out: 'Launching bug hunt...', action: 'bughunt' }),
  palette: () => ({ out: 'Opening the palette...', action: 'palette' }),
  achievements: (_, ctx) => ({ out: ctx.achievements.text() }),
  matrix: () => ({ out: 'Wake up...', action: 'matrix' }),
  clear: () => ({ out: '', action: 'clear' }),
  sudo: () => ({ out: 'Nice try. You already have root here.' }),
  ls: () => ({ out: 'about  work  skills  blog  hire  contact  resume  gh  game  matrix' }),
  exit: () => ({ out: 'bye.', action: 'close' }),
};

export function runCommand(line, ctx) {
  const [cmd = '', arg = ''] = String(line ?? '').trim().toLowerCase().split(/\s+/);
  if (!cmd) return { out: '' };
  if (!Object.hasOwn(COMMANDS, cmd)) return { out: `command not found: ${cmd}. type 'help'` };
  return COMMANDS[cmd](arg, ctx);
}
