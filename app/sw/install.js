

async function getRegistration() {
  if (!('serviceWorker' in navigator)) {
    return await Promise.reject(new Error('Service workers aren\'t supported in this browser.'));
  }
  return await navigator.serviceWorker.register('/beer-service-worker.js');
}

export default getRegistration;
