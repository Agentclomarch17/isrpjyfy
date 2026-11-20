for (const button of document.querySelectorAll('button')) {
  button.addEventListener('click', async () => {
    const status = document.getElementById('status');
    const buttons = document.querySelectorAll('button');
    buttons.forEach(el => { el.disabled = true; });
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || new URL(tab.url).origin !== 'https://app.hoplite.sh') {
        status.textContent = 'Open Hoplite below, sign in, then reopen the extension.';
        return;
      }
      if (button.id === 'create') {
        status.textContent = 'Submitting once and waiting for the Free option…';
        status.textContent = await chrome.runtime.sendMessage({ action: 'create', tabId: tab.id });
        return;
      }
      const [response] = await chrome.scripting.executeScript({
        target: { tabId: tab.id }, func: runOnHoplite, args: [button.id]
      });
      status.textContent = response.result;
    } catch {
      status.textContent = 'The tab changed or is unavailable. Reopen the extension on Hoplite.';
    } finally {
      buttons.forEach(el => { el.disabled = false; });
    }
  });
}
