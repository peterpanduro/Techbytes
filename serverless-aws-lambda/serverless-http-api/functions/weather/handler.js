const smhi = require("./smhi");
const yrno = require("./yrno");

exports.weather = async (event) => {
  try {
    const { lat, lon } = checkParams(event);
    const smhiTimeSeries = await smhi.smhi(lat, lon);
    const yrnoTimeSeries = await yrno.yrno(lat, lon);
    const averagedTimeSeries = average(smhiTimeSeries, yrnoTimeSeries);
    const data = {
      smhi: smhiTimeSeries,
      yrno: yrnoTimeSeries,
      average: averagedTimeSeries,
    };
    return sendResponse(200, JSON.stringify(data));
  } catch (error) {
    return sendResponse(500, JSON.stringify({ error: error.message }));
  }
};

const checkParams = (event) => {
  const params = event.queryStringParameters;
  if (!params.lat) {
    throw new Error("Parameter lat is required");
  }
  if (!params.lon) {
    throw new Error("Parameter lon is required");
  }
  return params;
};

const average = (arr1, arr2) => {
  const minLength = Math.min(arr1.length, arr2.length);
  let arr = [];
  for (let i = 0; i < minLength; i++) {
    arr[i] = (arr1[i] + arr2[i]) / 2;
  }
  return arr;
};

const sendResponse = (statusCode, body) => {
  return {
    statusCode,
    body,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; object-src 'none';",
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
    },
  };
};
