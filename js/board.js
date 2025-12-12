class Board {
  constructor(boardId) {
    this.boardEl = document.getElementById(boardId);
    this.cells = [];
  }

  render() {
    this.boardEl.innerHTML = "";
    for (let i = 0; i < 225; i++) { // 15x15 grid
      const cell = document.createElement("div");
      cell.classList.add("border", "border-gray-300", "w-full", "h-full", "relative", "bg-white");

      // inner container that will actually hold pawns. This allows multiple pawns
      // to be displayed neatly (flex wrap, centered). We push the inner container
      // into `this.cells` so existing code that appends pawns to board.cells[...] continues to work.
      const inner = document.createElement("div");
      inner.classList.add("cell-inner", "w-full", "h-full", "flex", "items-center", "justify-center", "gap-1", "flex-wrap", "p-1");
      inner.dataset.index = i;

      cell.appendChild(inner);
      this.boardEl.appendChild(cell);
      this.cells.push(inner);
    }
  }
}

window.Board = Board;
