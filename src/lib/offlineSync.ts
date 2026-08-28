export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}

export const getQueuedRequests = (): QueuedRequest[] => {
  const data = localStorage.getItem('cycleon_offline_queue');
  if (data) {
    return JSON.parse(data);
  }
  return [];
};

export const enqueueRequest = (url: string, method: string, headers: Record<string, string>, body: any) => {
  const queue = getQueuedRequests();
  queue.push({
    id: Date.now().toString(),
    url,
    method,
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    timestamp: Date.now()
  });
  localStorage.setItem('cycleon_offline_queue', JSON.stringify(queue));
};

export const removeQueuedRequest = (id: string) => {
  const queue = getQueuedRequests();
  const updated = queue.filter(q => q.id !== id);
  localStorage.setItem('cycleon_offline_queue', JSON.stringify(updated));
};

export const syncOfflineQueue = async () => {
  if (!navigator.onLine) return;
  const queue = getQueuedRequests();
  if (queue.length === 0) return;

  console.log(`Syncing ${queue.length} offline transactions to DB...`);
  for (const req of queue) {
    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      if (res.ok) {
        removeQueuedRequest(req.id);
      }
    } catch (err) {
      console.error('Offline sync failed for request', req.id, err);
      // Stop syncing if network drops again
      break;
    }
  }
};

export const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const isMutation = options?.method && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method.toUpperCase());
  
  if (!navigator.onLine && isMutation) {
    console.log('App is offline. Queuing transaction:', url);
    enqueueRequest(url, options.method!, options.headers as Record<string, string>, options.body);
    // Return a mock success response
    return new Response(JSON.stringify({ success: true, offline: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    
    if (contentType && contentType.includes('text/html')) {
      console.warn('Received HTML response where JSON was expected. Simulating JSON error response.');
      return new Response(
        JSON.stringify({ error: 'Session expired or invalid route. Please reload the page.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return res;
  } catch (err) {
    if (isMutation) {
      console.log('Network error. Queuing transaction:', url);
      enqueueRequest(url, options?.method!, options?.headers as Record<string, string>, options?.body);
      return new Response(JSON.stringify({ success: true, offline: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw err;
  }
};
