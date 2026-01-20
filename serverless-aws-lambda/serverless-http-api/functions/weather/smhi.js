exports.smhi = async (lat, lon) => {
  const response = await fetch(`https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${lon}/lat/${lat}/data.json?timeseries=24&parameters=air_temperature`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  const timeSeries = data.timeSeries;
  const airTemperature = timeSeries.map(item => item.data.air_temperature);
  return airTemperature;
};
