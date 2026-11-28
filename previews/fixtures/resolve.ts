// Aporia / Lacuna
interface Theme { name: string; mode: 'paper' | 'ink'; }
const themes: Theme[] = [
  { name: 'Lacuna Paper', mode: 'paper' },
  { name: 'Lacuna Ink', mode: 'ink' },
];
function resolve(mode: Theme['mode'], limit = 2) {
  return themes
    .filter(theme => theme.mode === mode)
    .slice(0, limit);
}
