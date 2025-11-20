// Sample Express server showing AI integration flow (example only)
// Usage: set OPENAI_API_KEY in env; run `node server.js`

const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

app.post('/api/recommend', async (req, res) => {
  const user = req.body.user || {};
  const products = req.body.products || [];

  // Compose a prompt summarizing user and candidate products
  const prompt = `User: ${JSON.stringify(user)}\n\nProducts: ${JSON.stringify(products.slice(0,10))}\n\nFor each product, provide a short reason (1-2 sentences) why it suits the user, and a suitability score 0-10.`;

  if(!OPENAI_API_KEY){
    return res.status(500).json({error:'OPENAI_API_KEY not configured. This is an example server.'});
  }

  try{
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages:[{role:'system',content:'You are an expert beauty advisor.'},{role:'user',content:prompt}],
        max_tokens:600
      })
    });
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || '';
    return res.json({ok:true, text});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'LLM call failed'});
  }
});

app.listen(3000, ()=>console.log('Server running on http://localhost:3000'));
