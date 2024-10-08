import { PositionChange } from "@mirohq/miro-api/dist/api.js";

export const BOXSIZE = 150
export const CARDWIDTH = 320, CARDHEIGHT = 60

/**
 * @type {Required<PositionChange>}
 */
export const calendarPosition = { x: 0, y: 0 }

/**
 * @type {Required<PositionChange>}
 */
export const listPosition = { x: 0, y: 1000 }

export const fontSize = Math.floor(BOXSIZE * 3 / 20)
export const textHeight = BOXSIZE / 2
export const stickySizeReduction = 50

/**
 * A function creator which helps to abstract away the coordinate calculation
 * The function created only requires an x and y value to generate a position
 * @param {{height: number, width: number, xOffset?: number, yOffset?: number}} offset 
 */
export const coordinateCalculator = ({ height, width, xOffset, yOffset }) =>
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns 
     */
    (x, y) => ({ x: width * (x + 0.5) + (xOffset ?? 0), y: height * (y + 0.5) + (yOffset ?? 0) })