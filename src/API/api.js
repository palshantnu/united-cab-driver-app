import axios from 'axios';

const BASE_URL = 'https://unitedcabsmerthyr.uk/api'; // your actual base url

export const updateLocation = (driver_id, lat, lng, isDriver = true) => {
  return axios.post(`${BASE_URL}/location/update`, {
    driver_id,
    lat,
    lng,
    isDriver,
  });
};
