const filter = document.querySelector('#token-filter');
const readingMode = document.querySelector('#reading-mode');
const roles = document.querySelector('#roles');
const roleCount = document.querySelector('#role-count');

for (const { key, paper, ink } of window.APORIA.semantic) {
  const row = roles.insertRow();
  row.dataset.role = key;
  const label = document.createElement('th');
  label.scope = 'row';
  label.textContent = key;
  row.append(label);

  for (const color of [paper, ink]) {
    const cell = row.insertCell();
    cell.className = 'token-value';
    const swatch = document.createElement('span');
    swatch.setAttribute('aria-hidden', 'true');
    swatch.style.backgroundColor = color;
    cell.append(swatch, document.createTextNode(color));
  }
}
function filterRoles() {
  const value = filter.value.trim().toLowerCase();
  let count = 0;
  for (const row of roles.rows) {
    row.hidden = !row.dataset.role.includes(value);
    count += Number(!row.hidden);
  }
  roleCount.textContent = count ? `${count} ${count === 1 ? 'role' : 'roles'}` : 'No matching roles';
}
filter.oninput = filterRoles;
readingMode.onclick = () => {
  const ink = document.documentElement.dataset.theme === 'paper';
  document.documentElement.dataset.theme = ink ? 'ink' : 'paper';
  readingMode.setAttribute('aria-pressed', String(ink));
};
filterRoles();
