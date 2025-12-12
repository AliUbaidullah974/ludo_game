class Pawn {
  constructor(color, startIndex) {
    this.color = color;
    this.position = startIndex;
    this.startIndex = startIndex;
    // logical state for full Ludo rules
    this.state = 'home'; // 'home' (off-board), 'path', 'homeColumn', 'finished'
    this.pathIndex = null; // 0..51 when on main path
    this.homeStep = null; // 0..5 when in home column
    this.finished = false;
    this.element = document.createElement("div");
    // make pawn an inline-block so multiple pawns wrap nicely inside the cell inner container
    this.element.className = `w-5 h-5 rounded-full shadow-md border-2 inline-block`;
    this.element.dataset.color = color;
    this.element.dataset.startIndex = startIndex;
    this.element.dataset.pawnId = `${color}-${Math.random().toString(36).slice(2,8)}`;
    this.element.title = `${color} pawn`;

    // Use inline styles for background and border color so dynamic colors work
    // without depending on Tailwind class-generation at runtime.
    const colorMap = {
      red: '#ef4444', // tailwind red-500
      blue: '#3b82f6', // tailwind blue-500
      green: '#10b981', // tailwind green-500
      yellow: '#f59e0b' // tailwind yellow-500
    };
    const borderMap = {
      red: '#7f1d1d',
      blue: '#1e3a8a',
      green: '#065f46',
      yellow: '#92400e'
    };

    const bg = colorMap[color] || '#6b7280';
    const bd = borderMap[color] || '#374151';
    this.element.style.backgroundColor = bg;
    this.element.style.borderColor = bd;
    // make cursor pointer for interactive selection
    this.element.style.cursor = 'pointer';
  }

  move(steps, board) {
    this.position += steps;
    if(this.position >= board.cells.length) this.position = board.cells.length - 1;
    board.cells[this.position].appendChild(this.element);
  }
}

window.Pawn = Pawn;
