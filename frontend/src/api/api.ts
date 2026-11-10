import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // The API expects repeated params for array filters (?status=a&status=b),
  // which is what its ListIncidentsQueryDto normalises. Axios would default to
  // `status[]=a`, so indexes are disabled globally.
  paramsSerializer: { indexes: null },
});

/** Message shown to the user when a request fails. */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    // class-validator returns an array of messages, one per failed constraint.
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    return error.message;
  }

  return 'Algo ha ido mal';
};
