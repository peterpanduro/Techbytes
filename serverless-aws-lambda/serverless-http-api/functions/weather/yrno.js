exports.yrno = async (lat, lon) => {
  const response = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  const timeSeries = data.properties.timeseries;
  const airTemperature = timeSeries.map(item => item.data.instant.details.air_temperature);
  return airTemperature;
};
