import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import portfolioData from './data/portfolio.json';
const app: Application = express();
const nodemailer = require('nodemailer');

dotenv.config();
app.use(express.json());

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      `${process.env.ADMIN_URI}`,
      `${process.env.CLIENT_URI}`,
      `${process.env.CLIENT_URI2}`,
      `${process.env.CLIENT_URI3}`,
      `${process.env.CLIENT_URI4}`,
    ],
    credentials: true,
  }),
);
/////////////////////////////////////this was added last
// Security headers
// app.use((req: Request, res: Response, next) => {
//   res.setHeader('X-Frame-Options', 'SAMEORIGIN');
//   res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
//   next();
// });
//////////////////////////////////////////////
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 200,
    message: 'Server is running',
  });
});

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DATABASE_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const users = client.db('portfolio-admin-server').collection('users');
    const projects = client.db('portfolio-admin-server').collection('projects');
    const skills = client.db('portfolio-admin-server').collection('skills');
    const blogs = client.db('portfolio-admin-server').collection('blogs');
    const cpProfiles = client.db('portfolio-admin-server').collection('cpProfiles');

    // projects
    app.post('/project', async (req, res) => {
      const body = req.body;
      const result = await projects.insertOne(body);
      res.send(result);
    });
    app.get('/project', async (req, res) => {
      const result = await projects.find().toArray();
      res.send(result);
    });
    app.get('/project/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const result = await projects.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.delete('/project/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const result = await projects.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // blogs
    const sanitizeHtml = require("sanitize-html"); // Move import to top of file

// Configure sanitize-html options
    const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's',
    'ol', 'ul', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img', 'span'
  ],
  allowedAttributes: {
    'a': ['href', 'target'],
    'img': ['src', 'alt', 'width', 'height'],
    '*': ['class', 'style'] // Be careful with style attribute
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedStyles: {
    '*': {
      color: [
        /^#[0-9a-fA-F]{3,8}$/,
        /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/,
        /^rgba\((\s*\d+\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/
      ],
      'background-color': [
        /^#[0-9a-fA-F]{3,8}$/,
        /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/,
        /^rgba\((\s*\d+\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/
      ]
    }
  },
  allowedSchemesByTag: {
    img: ['http', 'https', 'data']
  }
    };

    app.post('/blog-editor', async (req, res) => {
      try {
        const {
          title,
          category,
          imgUrl,
          shortDes,
          content,
          readTime,
          author,
          featured,
          tags,
        } = req.body;

        // Basic validation for required string fields
        if (!title || typeof title !== 'string' || !title.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Title is required and must be a non-empty string',
          });
        }

        if (!category || typeof category !== 'string' || !category.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Category is required and must be a non-empty string',
          });
        }

        // Validate content
        if (!content || typeof content !== 'string' || !content.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Content is required and must be a non-empty string',
          });
        }

        // Sanitize HTML to prevent XSS
        const safeContent = sanitizeHtml(content.trim(), sanitizeOptions);

        // Validate sanitized content isn't empty
        if (!safeContent.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Content contains no valid HTML elements',
          });
        }

        const now = new Date();

        const doc: any = {
          des: safeContent,
          title: title.trim(),
          category: category.trim(),
          imgUrl:
            typeof imgUrl === 'string'
              ? imgUrl.trim()
              : '',
          shortDes:
            typeof shortDes === 'string'
              ? shortDes.trim()
              : '',
          // Use server time to keep a consistent format
          time: now.toISOString(),
          // Keep existing UI expectation: "5 min read"
          readTime:
            typeof readTime === 'string' && readTime.trim()
              ? `${readTime.trim()} min read`
              : '5 min read',
          // Simple ordering field, larger = newer
          no: now.getTime(),
          featured: Boolean(featured),
          author:
            typeof author === 'string' && author.trim()
              ? author.trim()
              : 'Al Amin',
          createdAt: now,
          updatedAt: now,
        };

        if (Array.isArray(tags)) {
          doc.tags = tags
            .map((t) => (typeof t === 'string' ? t.trim() : ''))
            .filter((t) => t.length > 0);
        }

        const result = await blogs.insertOne(doc);

        if (!result.insertedId) {
          return res.status(500).json({
            success: false,
            message: 'Failed to save blog post',
          });
        }

        res.status(201).json({
          success: true,
          message: 'Blog post created successfully',
          blogId: result.insertedId,
        });
      } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    });

    app.post('/blog', async (req, res) => {
      const body = req.body;
      const result = await blogs.insertOne(body);
      res.send(result);
    });
    app.get('/blog', async (req, res) => {
      const result = await blogs.find().toArray();
      res.send(result);
    });
    app.get('/blog/comments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await blogs.findOne(
      { _id: new ObjectId(id) },
      { projection: { comments: 1 } }
    );

    if (blog) {
      res.status(200).json({
        success: true,
        comments: blog.comments || []
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments"
    });
  }
});
    app.delete('/blog/:id', async (req, res) => {
      const id = req.params.id;
      const result = await blogs.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    //comments for blogs
    app.post('/blog/comments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, comment } = req.body;

    const newComment = {
      _id: new ObjectId(),
      name,
      comment,
      createdAt: new Date()
    };

    const result = await blogs.updateOne(
      { _id: new ObjectId(id) },
      { $push: { comments: newComment } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({
        success: true,
        comment: newComment,
        message: "Comment added successfully"
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment"
    });
  }
});

    // cpProfiles
    app.post('/cpProfile', async (req, res) => {
        const body = req.body;
        const result = await cpProfiles.insertOne(body);
        res.send(result);
        });    app.get('/cpProfile', async (req, res) => {
        const result = await cpProfiles.find().toArray();
        res.send(result);
        });
    app.get('/cpProfiles', async (req, res) => {
        const result = await cpProfiles.find().toArray();
        res.send(result);
    });
    app.get('/cpProfile/:id', async (req, res) => {
        const id = req.params.id;
        const result = await cpProfiles.findOne({ _id: new ObjectId(id) });
        res.send(result);
    });
    app.delete('/cpProfile/:id', async (req, res) => {
        const id = req.params.id;
        const result = await cpProfiles.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    });

    app.patch('/cpProfile/:id', async (req, res) => {
      const id = req.params.id;
      const body = req.body;
        const result = await cpProfiles.updateOne(
            { _id: new ObjectId(id) },
            { $set: body },
        );
        res.send(result);
    }
    );


    // skills
    // app.post('/skill', async (req, res) => {
    //   const body = req.body;
    //   const result = await skills.insertOne(body);
    //   res.send(result);
    // });
    // app.get('/skill', async (req, res) => {
    //   const result = await skills.find().toArray();
    //   // console.log(result)
    //   res.send(result);
    // });
    // app.delete('/skill/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const result = await skills.deleteOne({ _id: new ObjectId(id) });
    //   res.send(result);
    // });
    // user
    app.post('/login', async (req, res) => {
      const userData = req.body;
      console.log(userData);
      // username, password
      const user = await users.findOne({ username: userData?.username });
      if (!user) {
        return res.send({ error: 404, message: 'user not found' });
      }

      if (userData.password !== user.password) {
        return res.send({ error: 404, message: 'wrong password' });
      }

      const userPayload = {
        _id: user?._id,
        username: user?.username,
      };

      const accessToken = jwt.sign(
        userPayload,
        process.env.JWT_ACCESS_SECRET as string,
        {
          expiresIn: '100d',
        },
      );
      res.send({ token: accessToken });
    });

// blog like
app.post('/blog/like/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const result = await blogs.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { likes: 1 } }
    );

    if (result.modifiedCount > 0) {
      // Get updated blog to return current likes count
      const updatedBlog = await blogs.findOne({ _id: new ObjectId(id) });

      res.status(200).json({
        success: true,
        likes: updatedBlog.likes || 1,
        message: "Blog liked successfully"
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }
  } catch (error) {
    console.error('Error liking blog:', error);
    res.status(500).json({
      success: false,
      message: "Failed to like blog"
    });
  }
});
//blog love
app.post('/blog/love/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const result = await blogs.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { loves: 1 } }
    );

    if (result.modifiedCount > 0) {
      // Get updated blog to return current loves count
      const updatedBlog = await blogs.findOne({ _id: new ObjectId(id) });

      res.status(200).json({
        success: true,
        loves: updatedBlog.loves || 1,
        message: "Blog loved successfully"
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }
  } catch (error) {
    console.error('Error loving blog:', error);
    res.status(500).json({
      success: false,
      message: "Failed to love blog"
    });
  }
});


    type TInputs = {
      name: string;
      email: string;
      subject: string;
      message: string;
    };
    app.post('/send-mail', async (req, res) => {
      try {
        const mails: TInputs = req.body;
        // console.log({ mails });
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          service: 'gmail',
          port: 587,
          secure: false,
          auth: {
            user: process.env.USER,
            pass: process.env.PASS,
          },
        });

        await transporter.sendMail({
          from: `${mails.name} <${process.env.USER}> `,
          replyTo: mails.email,
          to: process.env.USER,
          subject: mails.subject,
          text: mails.message,
        });

        res.json({
          success: true,
          message: `Email sent successfully to ${process.env.USER}.`,
        });
      } catch (error) {
        res.json({
          success: false,
          message: `Email could not sent. Please try again.`,
        });
      }
    });
    app.post('/send-mails', async (req, res) => {
      try {
        const mails: TInputs = req.body;
        // console.log({ mails });
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          service: 'gmail',
          port: 587,
          secure: false,
          auth: {
            user: process.env.USER1,
            pass: process.env.PASS1,
          },
        });

        await transporter.sendMail({
          from: `${mails.name} <${process.env.USER1}> `,
          replyTo: mails.email,
          to: process.env.USER1,
          subject: mails.subject,
          text: mails.message,
        });

        res.json({
          success: true,
          message: `Email sent successfully to ${process.env.USER1}.`,
        });
      } catch (error) {
        res.json({
          success: false,
          message: `Email could not sent. Please try again.`,
        });
      }
    });


    /////////// ai///////////////
    app.post('/api/chat', async (req: Request, res: Response) => {

        try {
          const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
          const groqApiKey = process.env.GROQ_API_KEY;

          if (!geminiApiKey && !groqApiKey) {
            return res.status(503).json({
              message: 'Chat is not configured on the server yet.',
            });
          }

          const body = req.body as { message?: unknown };
          const userText = typeof body.message === 'string' ? body.message.trim() : '';
          if (!userText) {
            return res.status(400).json({
              message: 'Expected a non-empty message string.',
            });
          }

          const portfolioText = JSON.stringify(portfolioData, null, 2);
          const systemInstruction = `You are a helpful assistant for Al Amin's portfolio website. Answer using ONLY the JSON data below. If something is not in the data, say the portfolio does not list that information — do not invent facts. Keep answers concise and friendly.

         Portfolio data (JSON):
         ${portfolioText}`;

          if (geminiApiKey) {
            const models = [
              process.env.GEMINI_MODEL,
              'gemini-2.0-flash-lite',
            ].filter((model): model is string => Boolean(model));

            for (const model of models) {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

              const geminiRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  systemInstruction: {
                    parts: [{ text: systemInstruction }],
                  },
                  contents: [
                    {
                      role: 'user',
                      parts: [{ text: userText }],
                    },
                  ],
                }),
              });

              if (!geminiRes.ok) {
                const errText = await geminiRes.text();
                console.error('Gemini API error', model, geminiRes.status, errText);
                continue;
              }

              const data = (await geminiRes.json()) as {
                candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
              };
              const reply =
                data.candidates?.[0]?.content?.parts
                  ?.map((part) => part.text ?? '')
                  .join('')
                  .trim() ?? '';

              if (reply) {
                return res.json({ message: reply });
              }
            }
          }

          if (groqApiKey) {
            const groqModel = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${groqApiKey}`,
              },
              body: JSON.stringify({
                model: groqModel,
                messages: [
                  { role: 'system', content: systemInstruction },
                  { role: 'user', content: userText },
                ],
                temperature: 0.2,
              }),
            });

            if (groqRes.ok) {
              const data = (await groqRes.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
              };
              const reply = data.choices?.[0]?.message?.content?.trim() ?? '';
              if (reply) {
                return res.json({ message: reply });
              }
            } else {
              const errText = await groqRes.text();
              console.error('Groq API error', groqRes.status, errText);
            }
          }

          return res.json({
            message: 'Free AI quota is currently unavailable. Please try again later.',
          });
        } catch (err) {
          console.error('[api/chat] Unhandled error', err);
          return res.status(500).json({
            message: 'Internal server error.',
          });
        }
      });

  } finally {
  }
}
run().catch(console.dir);

export default app;
