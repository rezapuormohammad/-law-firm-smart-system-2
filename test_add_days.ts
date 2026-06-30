import { jalaliToGregorian } from './src/utils/shamsi.ts';

// Add days to Jalali function (copied from calculators.ts to test)
const addDaysToJalaliDynamic = (jyVal: number, jmVal: number, jdVal: number, daysVal: number) => {
    let jyTmp = jyVal, jmTmp = jmVal, jdTmp = jdVal + daysVal;
    while (true) {
      let mDays = 30;
      if (jmTmp >= 1 && jmTmp <= 6) mDays = 31;
      else if (jmTmp >= 7 && jmTmp <= 11) mDays = 30;
      else {
        const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(jyTmp % 33);
        mDays = isLeap ? 30 : 29;
      }
      if (jdTmp > mDays) {
        jdTmp -= mDays;
        jmTmp++;
        if (jmTmp > 12) {
          jmTmp = 1;
          jyTmp++;
        }
      } else if (jdTmp <= 0) {
        jmTmp--;
        if (jmTmp <= 0) {
          jmTmp = 12;
          jyTmp--;
        }
        let prevMDays = 30;
        if (jmTmp >= 1 && jmTmp <= 6) prevMDays = 31;
        else if (jmTmp >= 7 && jmTmp <= 11) prevMDays = 30;
        else {
          const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(jyTmp % 33);
          prevMDays = isLeap ? 30 : 29;
        }
        jdTmp += prevMDays;
      } else {
        break;
      }
    }
    return { jy: jyTmp, jm: jmTmp, jd: jdTmp };
  };

const res = addDaysToJalaliDynamic(1405, 4, 19, 1);
console.log(res);
