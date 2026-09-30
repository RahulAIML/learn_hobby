const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = pages.find((item) => item.type === 'page' && item.url.includes('/login'));
if (!page) throw new Error('Live login page was not found in Chrome.');

const ws = new WebSocket(page.webSocketDebuggerUrl);
let sequence = 0;
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => reject(new Error('CDP evaluation timed out.')), 15_000);
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      clearTimeout(timeout);
      ws.removeEventListener('message', onMessage);
      resolve(message.result?.result?.value);
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
function evaluate(expression) { return command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); }
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
await evaluate(`document.querySelector('#email')?.focus()`);
await command('Input.insertText', { text: 'qa_live_1790104761862@gurukul.invalid' });
await evaluate(`document.querySelector('#password')?.focus()`);
await command('Input.insertText', { text: 'QaLivePass_2026!' });
await new Promise((resolve) => setTimeout(resolve, 100));
await evaluate(`document.querySelector('form')?.requestSubmit()`);
await new Promise((resolve) => setTimeout(resolve, 3000));
console.log(JSON.stringify(await evaluate(`(async () => {
  const response = await fetch('/api/auth/me');
  return { url: location.href, status: response.status, me: await response.json(), loginError: document.body.innerText.includes('Incorrect email or password.') };
})()`)));
ws.close();
