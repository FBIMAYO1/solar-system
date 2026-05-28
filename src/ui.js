export function showPlanetInfo(planetData) {
  const panel = document.getElementById('info-panel');
  document.getElementById('planet-name').textContent = planetData.name;
  document.getElementById('planet-description').textContent = planetData.description;

  const factsList = document.getElementById('planet-facts');
  factsList.innerHTML = '';
  planetData.facts.forEach((fact) => {
    const li = document.createElement('li');
    li.textContent = fact;
    factsList.appendChild(li);
  });

  panel.classList.remove('hidden');
}

export function hidePanel() {
  document.getElementById('info-panel').classList.add('hidden');
}

export function setupUI() {
  document.getElementById('close-panel').addEventListener('click', hidePanel);
}
