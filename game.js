canvas = document.createElement("canvas");
canvas.width = data.canvas.h * data.canvas.ratio;
canvas.height = data.canvas.h;
canvas.setAttribute("oncontextmenu", "return(false);");
ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
$("#wrap").append(canvas);
$("#wrap").css("width", canvas.width + "px");
$("#wrap").css("height", canvas.height + "px");

var gameState = "start";
var global = {};
var images = {};
var objects, players, turn;

["snake", "ladder", "player_0", "player_1"].forEach(i => {
  var img = new Image();
  img.src = `./image/${i}.png`;
  images[i] = img;
});

function reset() {
  objects = [];
  for (var i = 0; i < data.snakes + data.ladders; i++) {
    var obj;
    J: for (var j = 0; j < 1e4; j++) {
      obj = {
        type: i < data.snakes ? "snake" : "ladder",
        x0: F.randomInt(0, data.tiles - 1),
        y0: F.randomInt(0, data.tiles - 1),
        x1: F.randomInt(0, data.tiles - 1),
        y1: F.randomInt(0, data.tiles - 1),
      };
      if (obj.y0 === obj.y1) {
        continue J;
      }
      for (k in objects) {
        if (
          objects[k].x0 === obj.x0 ||
          objects[k].x1 === obj.x1 ||
          objects[k].y0 === obj.y0 ||
          objects[k].y1 === obj.y1
        ) {
          continue J;
        }
      }
      break;
    }

    if (obj) {
      if (obj.y0 > obj.y1) {
        obj = {
          ...obj,
          y0: obj.y1,
          y1: obj.y0,
        };
      }
      objects.push(obj);
    }
  }

  players = [];
  for (var i = 0; i < 2; i++) {
    players.push({
      x: 0,
      y: data.tiles - 1,
    });
  }

  turn = 0;
  gameState = "play";
}

function render() {
  F.fillCanvas(ctx, color.board_a);
  var size = canvas.width / data.tiles;

  ctx.fillStyle = color.board_b;
  for (var x = 0; x < data.tiles; x++) {
    for (var y = 0; y < data.tiles; y++) {
      if ((x + y) % 2) {
        ctx.fillRect(x * size, y * size, size, size);
      }
    }
  }

  for (var i in objects) {
    var angle =
      Math.PI * 1.5 +
      F.coords2angle(
        objects[i].x0,
        objects[i].y0,
        objects[i].x1,
        objects[i].y1,
      );
    var distance =
      F.pythag(objects[i].x1 - objects[i].x0, objects[i].y1 - objects[i].y0) +
      1;

    ctx.save();
    ctx.translate((objects[i].x0 + 0.5) * size, (objects[i].y0 + 0.5) * size);
    ctx.rotate(angle);
    ctx.translate(-(objects[i].x0 + 0.5) * size, -(objects[i].y0 + 0.5) * size);

    ctx.drawImage(
      images[objects[i].type],
      objects[i].x0 * size,
      objects[i].y0 * size,
      size,
      distance * size,
    );
    ctx.restore();
  }

  for (var i = 0; i < 2; i++) {
    var x = players[i].x;
    var y = players[i].y;
    if (true) {
      var time = players[i].wasObject ? 250 : 500;
      if (players[i].lastRoll + time > Date.now()) {
        var newX = players[i].wasObject ? players[i].beforeX : players[i].x;
        var newY = players[i].wasObject ? players[i].beforeY : players[i].y;
        x =
          players[i].prevX +
          (newX - players[i].prevX) *
            ((Date.now() - players[i].lastRoll) / time);
        y =
          players[i].prevY +
          (newY - players[i].prevY) *
            ((Date.now() - players[i].lastRoll) / time);
      } else if (
        players[i].wasObject &&
        players[i].lastRoll + 500 > Date.now() - time
      ) {
        x =
          players[i].beforeX +
          (players[i].x - players[i].beforeX) *
            ((Date.now() - (players[i].lastRoll + time)) / 500);
        y =
          players[i].beforeY +
          (players[i].y - players[i].beforeY) *
            ((Date.now() - (players[i].lastRoll + time)) / 500);
      }
    }

    ctx.drawImage(images["player_" + i], x * size, y * size, size, size);
  }

  if (global.lastRoll + 1000 > Date.now()) {
    ctx.fillStyle = F.hsv2hex(
      0,
      0,
      100,
      256 - ((Date.now() - global.lastRoll) / 1000) * 256,
    );
    ctx.font = "bold 150px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(global.lastDice ?? "??", canvas.width / 2, canvas.height / 2);
  }
}

function main() {
  update((Date.now() - then) / 1000);
  render();
  then = Date.now();
  requestAnimationFrame(main);
}
function update(mod) {
  if (gameState == "play") {
    if (F.keys.Space) {
      if (global.once_roll) {
        global.once_roll = false;
        global.once_roll = false;
        roll();
      }
    } else {
      global.once_roll = true;
    }
  }
}

var then = Date.now();
reset();
main();

function roll() {
  var dice = F.randomInt(1, 6);
  // dice = 1;
  global.lastDice = dice;
  players[turn].lastRoll = Date.now();
  global.lastRoll = Date.now();

  players[turn].prevX = players[turn].x;
  players[turn].prevY = players[turn].y;

  players[turn].x += ((players[turn].y % 2) * 2 - 1) * dice;
  if (players[turn].x >= data.tiles) {
    players[turn].x = data.tiles - 1 - (players[turn].x - data.tiles);
    players[turn].y--;
  }
  if (players[turn].x < 0) {
    players[turn].x = -1 - players[turn].x;
    players[turn].y--;
  }

  if (players[turn].x < 0) {
    players[turn].x = 0;
  }
  if (players[turn].y < 0) {
    players[turn].y = 0;
  }

  players[turn].beforeX = players[turn].x;
  players[turn].beforeY = players[turn].y;

  players[turn].wasObject = false;
  for (var i in objects) {
    if (
      (players[turn].x === objects[i].x0 &&
        players[turn].y === objects[i].y0) ||
      (players[turn].x === objects[i].x1 && players[turn].y === objects[i].y1)
    ) {
      var low = [objects[i].x1, objects[i].y1];
      var high = [objects[i].x0, objects[i].y0];
      if (objects[i].y0 > objects[i].y1) {
        [low, high] = [high, low];
      } else if (objects[i].y0 === objects[i].y1) {
        if (objects[i].x0 === objects[i].x1) {
          break;
        }
        if (
          (objects[i].x0 < objects[i].x1 && players[turn].y % 2) ||
          (objects[i].x0 > objects[i].x1 && 1(players[turn].y % 2))
        ) {
          [low, high] = [high, low];
        }
      }

      players[turn].x = objects[i].type === "snake" ? low[0] : high[0];
      players[turn].y = objects[i].type === "snake" ? low[1] : high[1];
      if (
        !(
          players[turn].x === players[turn].beforeX &&
          players[turn].y === players[turn].beforeY
        )
      ) {
        players[turn].wasObject = true;
        break;
      }
    }
  }

  turn = turn ? 0 : 1;
}
