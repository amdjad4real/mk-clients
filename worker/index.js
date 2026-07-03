export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { message } = await request.json();
    if (!message) {
      return new Response('Missing message', { status: 400 });
    }

    const resp = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(err, { status: 500 });
    }

    return new Response('OK', { status: 200 });
  }
};
