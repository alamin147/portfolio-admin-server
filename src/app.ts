import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
const app: Application = express();

app.use(express.json());

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://porfolio-admin-client.vercel.app',
      'https://portfolio-alamin-dev.vercel.app',
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
    app.delete('/blog/:id', async (req, res) => {
      const id = req.params.id;
      const result = await blogs.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // skills
    app.post('/skill', async (req, res) => {
      const body = req.body;
      const result = await skills.insertOne(body);
      res.send(result);
    });
    app.get('/skill', async (req, res) => {
      const result = await skills.find().toArray();
      // console.log(result)
      res.send(result);
    });
    app.delete('/skill/:id', async (req, res) => {
      const id = req.params.id;
      const result = await skills.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
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
  } finally {
  }
}
run().catch(console.dir);

export default app;
