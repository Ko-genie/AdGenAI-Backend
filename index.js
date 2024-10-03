const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000'
}));

async function scrapeProductData(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
      
        // Extract title, description, and fallback to first paragraph if description is missing
        const title = $('title').text() || 'No title available';
        let description = $('meta[name="description"]').attr('content') || '';
      
        if (!description || description.length < 10) {
            // Fallback to first paragraph or first heading for more meaningful content
            description = $('p').first().text() || $('h1').text() || $('h2').text() || 'No relevant content found';
        }
      
        return { title, description };
    } catch (error) {
        console.error('Error scraping product data:', error.message);
        return { title: 'Error', description: 'Failed to scrape the product data' };
    }
}

app.post('/generateAd', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'No URL provided' });
    }

    try {
        console.log('Received URL:', url);
        
        // Scrape product data
        const productData = await scrapeProductData(url);
        console.log('Scraped Product Data:', productData);

        if (!productData.description || productData.description.length < 10) {
            return res.status(422).json({ message: 'Invalid or too vague product description for generating an ad' });
        }

        // Generate ad using OpenAI
        const prompt = `Generate an ad for the following subject:
                        Title: ${productData.title}
                        Description: ${productData.description}`;

        const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are an AI that generates ad copy." },
                { role: "user", content: prompt }
            ],
            max_tokens: 100
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const adCopy = gptResponse.data.choices[0].message.content;

        res.json({ adCopy });
    } catch (error) {
        console.error('Error generating ad:', error);
        res.status(500).json({ message: 'Error generating ad', error });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
