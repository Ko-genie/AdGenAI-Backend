app.post('/createAd', async (req, res) => {
  const { url, gender, ageGroup } = req.body; // Get gender and age group from the request

  if (!url) {
    return res.status(400).json({ message: 'No URL provided' });
  }

  try {
    console.log('Received URL:', url);
    
    // Scrape product data
    const productData = await scrapeProductData(url);
    console.log('Scraped Product Data:', productData);

    // Custom ad description based on gender and age group
    let targetDescription = '';

    if (gender === 'female') {
      if (ageGroup === '9-18') {
        targetDescription = 'The ad should appeal to young girls with a focus on fun, color, and trendy designs.';
      } else if (ageGroup === '18-25') {
        targetDescription = 'The ad should emphasize style, comfort, and empowerment, as young women in this age group often look for products that complement their personal style and lifestyle.';
      } else if (ageGroup === '25-40') {
        targetDescription = 'For women in this age group, the ad should focus on a balance of comfort, elegance, and professional appeal.';
      } else if (ageGroup === '40-60') {
        targetDescription = 'The ad should emphasize comfort, sophistication, and practicality, appealing to women who value quality and timeless style.';
      } else if (ageGroup === '60+') {
        targetDescription = 'The ad should highlight comfort, elegance, and the product’s ability to bring relaxation and ease to daily life.';
      }
    } else if (gender === 'male') {
      if (ageGroup === '9-18') {
        targetDescription = 'The ad should appeal to young boys or teens, focusing on energy, coolness, and modern trends.';
      } else if (ageGroup === '18-25') {
        targetDescription = 'The ad should focus on style, confidence, and boldness, appealing to young men who are exploring their identity and fashion preferences.';
      } else if (ageGroup === '25-40') {
        targetDescription = 'For men in this age group, the ad should emphasize practicality, style, and versatility.';
      } else if (ageGroup === '40-60') {
        targetDescription = 'The ad should appeal to men with a focus on quality, durability, and classic style, suitable for both personal and professional settings.';
      } else if (ageGroup === '60+') {
        targetDescription = 'The ad should highlight comfort, ease of use, and thoughtful gifts for loved ones.';
      }
    } else if (gender === 'others') {
      targetDescription = 'The ad should emphasize inclusivity, comfort, and a sense of belonging, appealing to individuals of diverse identities who value style and self-expression across all age groups.';
    }

    const prompt = `Generate an ad for the following product:
                    Brand: ${productData.brandName}
                    Product: ${productData.productName}
                    Description: ${productData.productDescription}
                    Targeted at a ${gender} audience in the age group of ${ageGroup}.
                    ${targetDescription}`;

    // Generate ad copy using OpenAI API
    const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI that generates ad copy." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    const adCopy = gptResponse.data.choices[0].message.content;

    res.json({
      ...productData,
      adCopy,
    });
  } catch (error) {
    console.error('Error generating ad:', error);
    res.status(500).json({ message: 'Error generating ad', error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});