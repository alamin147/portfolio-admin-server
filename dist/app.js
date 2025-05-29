"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const app = (0, express_1.default)();
const nodemailer = require('nodemailer');
dotenv_1.default.config();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        `${process.env.ADMIN_URI}`,
        `${process.env.CLIENT_URI}`,
    ],
    credentials: true,
}));
app.get('/', (req, res) => {
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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = client.db('portfolio-admin-server').collection('users');
            const projects = client.db('portfolio-admin-server').collection('projects');
            const skills = client.db('portfolio-admin-server').collection('skills');
            const blogs = client.db('portfolio-admin-server').collection('blogs');
            const cpProfiles = client.db('portfolio-admin-server').collection('cpProfiles');
            // projects
            app.post('/project', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const body = req.body;
                const result = yield projects.insertOne(body);
                res.send(result);
            }));
            app.get('/project', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const result = yield projects.find().toArray();
                res.send(result);
            }));
            app.get('/project/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = req.params.id;
                // console.log(id);
                const result = yield projects.findOne({ _id: new mongodb_1.ObjectId(id) });
                res.send(result);
            }));
            app.delete('/project/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = req.params.id;
                // console.log(id)
                const result = yield projects.deleteOne({ _id: new mongodb_1.ObjectId(id) });
                res.send(result);
            }));
            // blogs
            app.post('/blog', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const body = req.body;
                const result = yield blogs.insertOne(body);
                res.send(result);
            }));
            app.get('/blog', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const result = yield blogs.find().toArray();
                res.send(result);
            }));
            app.delete('/blog/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = req.params.id;
                const result = yield blogs.deleteOne({ _id: new mongodb_1.ObjectId(id) });
                res.send(result);
            }));
            // cpProfiles
            app.post('/cpProfile', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const body = req.body;
                const result = yield cpProfiles.insertOne(body);
                res.send(result);
            }));
            app.get('/cpProfile', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const result = yield cpProfiles.find().toArray();
                res.send(result);
            }));
            app.get('/cpProfiles', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const result = yield cpProfiles.find().toArray();
                res.send(result);
            }));
            app.get('/cpProfile/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = req.params.id;
                const result = yield cpProfiles.findOne({ _id: new mongodb_1.ObjectId(id) });
                res.send(result);
            }));
            app.delete('/cpProfile/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = req.params.id;
                const result = yield cpProfiles.deleteOne({ _id: new mongodb_1.ObjectId(id) });
                res.send(result);
            }));
            app.patch('/cpProfile/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = req.params.id;
                const body = req.body;
                const result = yield cpProfiles.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: body });
                res.send(result);
            }));
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
            app.post('/login', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const userData = req.body;
                console.log(userData);
                // username, password
                const user = yield users.findOne({ username: userData === null || userData === void 0 ? void 0 : userData.username });
                if (!user) {
                    return res.send({ error: 404, message: 'user not found' });
                }
                if (userData.password !== user.password) {
                    return res.send({ error: 404, message: 'wrong password' });
                }
                const userPayload = {
                    _id: user === null || user === void 0 ? void 0 : user._id,
                    username: user === null || user === void 0 ? void 0 : user.username,
                };
                const accessToken = jsonwebtoken_1.default.sign(userPayload, process.env.JWT_ACCESS_SECRET, {
                    expiresIn: '100d',
                });
                res.send({ token: accessToken });
            }));
            app.post('/send-mail', (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const mails = req.body;
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
                    yield transporter.sendMail({
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
                }
                catch (error) {
                    res.json({
                        success: false,
                        message: `Email could not sent. Please try again.`,
                    });
                }
            }));
        }
        finally {
        }
    });
}
run().catch(console.dir);
exports.default = app;
