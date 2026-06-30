import { jalaliToGregorian } from './src/utils/shamsi.ts';

const result = jalaliToGregorian(1405, 4, 11);
console.log(result);
const date = new Date(Date.UTC(result.gy, result.gm - 1, result.gd));
console.log("Day of week:", date.getUTCDay());
