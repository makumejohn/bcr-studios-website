
document.getElementById('year').textContent =
  new Date().getFullYear();

const grid = document.getElementById('tracks');

for (let i = 1; i <= 25; i++) {
  const card = document.createElement('div');
  card.className = 'track';

  const title = document.createElement('h3');
  title.textContent =
    'BCR Original Track ' + String(i).padStart(2, '0');

  const note = document.createElement('small');
  note.textContent = 'COMING SOON';

  card.append(title, note);
  grid.appendChild(card);
  }
    
