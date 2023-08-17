const isHorizontal = require('./horizontal');
const isVertical = require('./vertical');
const isDiagonal = require('./diagonal');

module.exports = (grid) => isHorizontal(grid) || isVertical(grid) || isDiagonal(grid);
