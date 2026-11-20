importScripts('flow.js');

const pending = new Set();

async function createAndChooseFree(tabId) {
  if (pending.has(tabId)) return 'Already waiting for this tab.';
  pending.add(tabId);
  const run = async step => {
    const [response] = await chrome.scripting.executeScript({
      target: { tabId }, func: runOnHoplite, args: [step]
    });
    return response?.result;
  };
  try {
    const prepared = await run('prepare');
    if (prepared !== 'ready') return prepared;
    const result = await run('create');
    if (result !== 'submitted') return result;
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 750));
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === 'loading') continue;
      if (!tab.url || new URL(tab.url).origin !== 'https://app.hoplite.sh') break;
      const message = await run('checkFree');
      if (message) return message;
    }
    return 'Stopped waiting. Check Hoplite; select Free on Hoplite if the plan screen appears.';
  } catch {
    return 'Setup was interrupted. Check Hoplite before submitting anything again.';
  } finally {
    pending.delete(tabId);
  }
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.url !== chrome.runtime.getURL('popup.html') ||
      message.action !== 'create' || !Number.isInteger(message.tabId)) return false;
  createAndChooseFree(message.tabId).then(respond);
  return true;
});
