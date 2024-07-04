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
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'https://porfolio-admin-client.vercel.app',
        'https://portfolio-alamin1.vercel.app',
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
            // skills
            app.post('/skill', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const body = req.body;
                const result = yield skills.insertOne(body);
                res.send(result);
            }));
            app.get('/skill', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const result = yield skills.find().toArray();
                // console.log(result)
                res.send(result);
            }));
            app.delete('/skill/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const id = req.params.id;
                const result = yield skills.deleteOne({ _id: new mongodb_1.ObjectId(id) });
                res.send(result);
            }));
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
        }
        finally {
        }
    });
}
run().catch(console.dir);
exports.default = app;
