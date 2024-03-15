import seedrandom from "seedrandom";

export const shuffleArray = (array: string[], seed: string) => {
  const rng = seedrandom(seed);
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    let j = Math.floor(rng() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray.slice(0, 3);
};
