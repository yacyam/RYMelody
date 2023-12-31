/**
 * Generates a specified amount of strings ranging in string length from a start
 * and end index
 * @param start Starting length of string
 * @param end Ending length of string
 * @param amount Amount of strings generated
 * @returns Array of generated strings of specified amount and length
 */
function generateRandomStrings(
  start: number,
  end: number,
  amount: number
): string[] {
  const allStrings: string[] = []

  const generateCharCode = () => {
    return Math.floor(Math.random() * 95) + 31
  }

  const createString = () => {
    const charCodeList = []
    const strLen = Math.floor(Math.random() * (end - start)) + start
    for (let i = strLen; i > 0; i -= 1) {
      charCodeList.push(generateCharCode())
    }
    return String.fromCharCode(...charCodeList)
  }

  for (let i = 0; i < amount; i += 1) {
    allStrings.push(createString())
  }

  return allStrings
}

/**
 * Generates a function which errors out or returns inputted value with equal
 * likelihood
 * @param value The value wished to be returned
 * @returns Function with desired value or error
 */
function returnsOrThrows(value: any): (() => void) | (() => any) {
  const chance = Math.random()

  if (chance < .5) {
    return () => {
      throw new Error('Failed');
    }
  }
  return () => { return value }
}

export {
  generateRandomStrings,
  returnsOrThrows
}