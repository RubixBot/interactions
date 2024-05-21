const matchReq = 4;
const numCols = 7;
const numRows = 6;


module.exports = (grid) => isTopRight(grid) || isTopLeft(grid);

function isTopLeft(grid) {
  let found;
  let foundPiece;
  let col;

  for (
    let baseCol = matchReq - numRows;
    baseCol < numCols - (matchReq - 1);
    baseCol++
  ) {

    found = 0;
    foundPiece = 0;
    col = baseCol - 1;

    for (let row = 0; row < numRows; row++) {
      col++;

      // Ensure that the given column and row are on the board
      if (col >= 0 && col < numCols && row < numRows) {

        let piece = grid[col][row];

        if(!piece) {
          found = 0;
        }

        if (!!piece && (piece === foundPiece || !foundPiece) && ++found === matchReq) {
          return true;
        }

        foundPiece = piece;
      }
    }
  }

  return false;
}

function isTopRight(grid) {
  let found;
  let foundPiece;
  let col;
  for (
    let baseCol = matchReq - numRows;
    baseCol < numCols - (matchReq - 1);
    baseCol++
  ) {

    found = 0;
    foundPiece = 0;
    col = baseCol - 1;
    for (let row = numRows - 1; row >= 0; row--) {
      col++;

      // Ensure that the given column and row are on the board
      if (col >= 0 && col < numCols && row < numRows) {

        let piece = grid[col][row];

        if(!piece) {
          found = 0;
        }

        if (!!piece && (piece === foundPiece || !foundPiece) && ++found === matchReq) {
          return true;
        }

        foundPiece = piece;
      }
    }
  }

  return false;
}
