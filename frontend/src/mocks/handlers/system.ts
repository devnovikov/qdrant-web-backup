import { http, HttpResponse, delay } from 'msw';

const mockCapabilities = {
  result: {
    isCloud: false,
  },
  status: 'ok',
  time: 0.001,
};

export const systemHandlers = [
  http.get('/api/v1/system/capabilities', async () => {
    await delay(50);
    return HttpResponse.json(mockCapabilities);
  }),
];
