const express = require("express");
const cors = require("cors");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

if (!process.env.OPENAI_API_KEY) {
   console.error("❌ OPENAI_API_KEY is missing!");
   process.exit(1);
}

const app = express();
app.use(express.json());
app.use(cors());

const posts = [];

const openai = new OpenAIApi(
   new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

// 📝 Serve index.html + style.css + frontend files
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
   res.sendFile(path.join(__dirname, "index.html"));
});

// Create Post
app.post("/api/post", (req, res) => {
   const { content, user, image } = req.body;
   const post = { id: posts.length + 1, user, content, image, likes: 0 };
   posts.unshift(post);
   res.json(post);
});

// Get All Posts
app.get("/api/posts", (req, res) => {
   res.json(posts);
});

// Like a Post
app.post("/api/post/:id/like", (req, res) => {
   const post = posts.find((p) => p.id == req.params.id);
   if (post) post.likes++;
   res.json(post);
});

// AI Suggestion
app.post("/api/ai-suggest", async (req, res) => {
   const { prompt, type } = req.body;
   let gptPrompt = "";

   if (type === "check_relevance") {
      gptPrompt = `Evaluate this post idea: "${prompt}". If bad, suggest a better one.`;
   } else if (type === "suggest_topic") {
      gptPrompt = "Suggest a fresh social media topic about AI or tech.";
   } else {
      return res.status(400).json({ error: "Invalid type" });
   }

   try {
      const response = await openai.createChatCompletion({
         model: "gpt-4",
         messages: [{ role: "user", content: gptPrompt }],
         max_tokens: 50,
      });

      res.json({ suggestion: response.data.choices[0].message.content.trim() });
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "AI Suggestion failed" });
   }
});

// Generate Avatar (DALL·E)
app.post("/api/generate-avatar", async (req, res) => {
   const { prompt } = req.body;

   try {
      const response = await openai.createImage({
         model: "dall-e-2",
         prompt,
         n: 1,
         size: "256x256",
      });

      const imageUrl = response.data.data[0].url;
      res.json({ avatarUrl: imageUrl });
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Avatar generation failed" });
   }
});

app.listen(5000, () => console.log("🚀 Running on http://localhost:5000"));
