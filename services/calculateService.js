const { roundFloatToInt, roundFloatToTwoDecimals } = require('../utils/mathUtils');

// Function that handles the round calculation
const calculateRound = (params) => {
  let wincount = 0;
  let losecount = 0;

  for (let number = 0; number < params.iterations; number++) {
    let framecount = 0;
    let myframecheck = 0;
    let yourframecheck = 0;
    let mygamehp = params.myhp;
    let yourgamehp = params.yourhp;

    let mylv = params.mycharlv;
    if (params.myclass < 3) {
      mylv += 20;
    } else {
      mylv += 5;
    }

    let yourlv = params.yourcharlv;
    if (params.yourclass < 3) {
      yourlv += 20;
    } else {
      yourlv += 5;
    }

    while (mygamehp > 0 && yourgamehp > 0) {
      framecount++;
      myframecheck++;
      yourframecheck++;
      let mywoundcondition = 0;
      let yourwoundcondition = 0;

      if (myframecheck - params.myframe >= 0) {
        myframecheck = myframecheck - params.myframe;
        let r_number = Math.random();
        if (r_number < 0.25 * roundFloatToTwoDecimals(
          (100 - params.yourdodge) / 100 * params.myar / (
            params.myar + params.yourdf * (100 - (params.mydfoff / 2)) / 100) * 2 * mylv / (mylv + yourlv))) {
          r_number = Math.floor(Math.random() * 100) + 1;
          if (r_number < params.mycrush) {
            yourgamehp -= roundFloatToInt(yourgamehp / 10 / params.yourreduce * 100);
          }
          r_number = Math.floor(Math.random() * 100) + 1;
          if (r_number < params.myopenwound) {
            yourwoundcondition = 200;
          }
          r_number = roundFloatToInt(
            Math.floor(Math.random() * (params.mymaxdmg / 6 * params.yourreduce / 100 - params.mymindmg / 6 * params.yourreduce / 100 + 1)) + (
              params.mymindmg / 6 * params.yourreduce / 100));
          let cdsrandom = Math.floor(Math.random() * 100) + 1;
          if (cdsrandom < (params.mycs + params.myds * (100 - params.mycs) / 100)) {
            yourgamehp -= r_number;
          }
          yourgamehp -= r_number;
        }
        mygamehp -= (params.yourthorns / 6 * params.myreduce / 100);
      }

      if (yourframecheck - params.yourframe >= 0) {
        yourframecheck = yourframecheck - params.yourframe;
        let r_number = Math.random();
        if (r_number < 0.25 * roundFloatToTwoDecimals(
          (100 - params.mydodge) / 100 * params.yourar / (
            params.yourar + params.mydf * (100 - (params.yourdfoff / 2)) / 100) * 2 * yourlv / (yourlv + mylv))) {
          r_number = Math.floor(Math.random() * 100) + 1;
          if (r_number < params.yourcrush) {
            mygamehp -= roundFloatToInt(mygamehp / 10 / params.myreduce * 100);
          }
          r_number = Math.floor(Math.random() * 100) + 1;
          if (r_number < params.youropenwound) {
            mywoundcondition = 200;
          }
          r_number = roundFloatToInt(
            Math.floor(Math.random() * (params.yourmaxdmg / 6 * params.myreduce / 100 - params.yourmindmg / 6 * params.myreduce / 100 + 1)) + (
              params.yourmindmg / 6 * params.myreduce / 100));
          let cdsrandom = Math.floor(Math.random() * 100) + 1;
          if (cdsrandom < (params.yourcs + params.yourds * (100 - params.yourcs) / 100)) {
            mygamehp -= r_number;
          }
          mygamehp -= r_number;
        }
        yourgamehp -= (params.mythorns / 6 * params.yourreduce / 100);
      }

      if (mywoundcondition > 0) {
        mywoundcondition -= 1;
        if (mygamehp > (45 * params.yourcharlv - 1319) / 256) {
          mygamehp -= (45 * params.yourcharlv - 1319) / 256;
        } else {
          mygamehp = 1;
        }
      }
      if (yourwoundcondition > 0) {
        yourwoundcondition -= 1;
        if (yourgamehp > (45 * params.mycharlv - 1319) / 256) {
          yourgamehp -= (45 * params.mycharlv - 1319) / 256;
        } else {
          yourgamehp = 1;
        }
      }
      if (mygamehp <= 0 && yourgamehp > 0) {
        losecount += 1;
      }
      if (mygamehp > 0 && yourgamehp <= 0) {
        wincount += 1;
      }

      if (framecount > 15000) {
        console.warn("Loop count exceeded 15000, breaking to prevent infinite loop");
        break;
      }
    }
  }

  const drawcount = params.iterations - wincount - losecount;
  const winRate = wincount / params.iterations * 100;

  return {
    winCount: wincount,
    loseCount: losecount,
    drawCount: drawcount,
    winRate: winRate
  };
};

module.exports = { calculateRound };
