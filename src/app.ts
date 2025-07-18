import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
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
    ],
    credentials: true,
  }),
);


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
  } finally {
  }
}
run().catch(console.dir);

export default app;
