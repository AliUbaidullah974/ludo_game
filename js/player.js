class Player {
  constructor(color, startIndex) {
    this.color = color;
    this.pawns = [];
    for(let i=0; i<4; i++) {
      this.pawns.push(new Pawn(color, startIndex));
    }
  }
}

window.Player = Player;
