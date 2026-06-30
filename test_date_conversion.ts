
import { jalaliToGregorian, getPersianDayName } from './src/utils/shamsi.ts';

const dates = [
  {jy: 1405, jm: 4, jd: 11},
  {jy: 1405, jm: 4, jd: 12},
  {jy: 1405, jm: 4, jd: 13},
];

dates.forEach(d => {
  const {gy, gm, gd} = jalaliToGregorian(d.jy, d.jm, d.jd);
  const date = new Date(Date.UTC(gy, gm - 1, gd));
  const dayName = getPersianDayName(d.jy, d.jm, d.jd);
  console.log(`${d.jy}/${d.jm}/${d.jd} -> G: ${gy}/${gm}/${gd}, UTC Day: ${date.getUTCDay()}, Name: ${dayName}`);
});
