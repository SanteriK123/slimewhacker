function createWalker(x, y) {
  // Fill initial array with the various wall tiles
  const array = Array.from({ length: x }, () =>
    Array(y).fill(Phaser.Math.Between(0, 2))
  );

  // Initialize walker position and get a random direction for it to start
  const walker = {
    row: Phaser.Math.Between(0, x - 1),
    col: Phaser.Math.Between(0, y - 1),
    direction: getRandomDirection(),
  };
  function getRandomDirection() {
    const directions = ["up", "down", "left", "right"];
    return directions[Phaser.Math.Between(0, 3)];
  }

  // Function to move the walker one step in the current direction
  function moveWalker() {
    switch (walker.direction) {
      case "left":
        if (walker.row > 0) {
          walker.row--;
        }
        break;
      case "right":
        if (walker.row < x - 1) {
          walker.row++;
        }
        break;
      case "up":
        if (walker.col < y - 1) {
          walker.col++;
        }
        break;
      case "down":
        if (walker.col > 0) {
          walker.col--;
        }
        break;
    }
  }

  // Function to perform the random walk for the specified number of steps
  function walk(steps) {
    let weight = 0;
    for (let i = 0; i < steps; i++) {
      if (steps - i == 1) {
        array[walker.row][walker.col] = 6;
      } else {
        array[walker.row][walker.col] = Phaser.Math.Between(3, 5); // Place floortiles
      }
      moveWalker();

      // Randomly change the direction with a probability of 25%, or if weight exceeds 2
      if (Math.random() < 0.25 || weight > 3) {
        walker.direction = getRandomDirection();
        weight = 0;
      }
      weight++;
    }

    return array;
  }

  return {
    walk,
    array,
  };
}

// Function to increase array size (Creating borders around generated map so player can't escape)
function increaseArraySize(originalArray, newSize) {
  const originalSize = originalArray.length;
  const newArray = [];

  for (let i = 0; i < newSize; i++) {
    newArray[i] = [];
    for (let j = 0; j < newSize; j++) {
      newArray[i][j] = null;
    }
  }

  // Start putting the original values into the "middle" of the new bigger array
  const startIndex = Math.floor((newSize - originalSize) / 2);
  for (let i = 0; i < originalSize; i++) {
    for (let j = 0; j < originalSize; j++) {
      newArray[startIndex + i][startIndex + j] = originalArray[i][j];
    }
  }

  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize; j++) {
      if (newArray[i][j] === null) {
        //Placing random wall tiles into remaining null values
        newArray[i][j] = Phaser.Math.Between(0, 2);
      }
    }
  }

  return newArray;
}

export { createWalker, increaseArraySize };
