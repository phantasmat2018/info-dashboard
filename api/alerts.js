const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // --- ВАЖЛИВІ РЯДКИ-ДОЗВОЛИ (CORS) ---
  // Дозволяємо запити з будь-якого джерела
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Вказуємо дозволені методи
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  // Вказуємо дозволені заголовки
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обробка preflight-запиту, який браузер надсилає автоматично
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // ------------------------------------

  const apiUrl = 'https://api.alerts.in.ua/v1/alerts/active.json';
  const apiToken = 'cce2a5a5af6ac920d797c0680135635066614ffcab2203';

  try {
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`API server responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('API Function Error:', error);
    res.status(500).json({ message: 'Failed to fetch data from alerts API' });
  }
};