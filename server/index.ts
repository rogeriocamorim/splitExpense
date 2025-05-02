import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET!;

app.use(cors());
app.use(express.json());

const CSV_PATH = path.join(__dirname, "expenses.csv");
const USERS_PATH = path.join(__dirname, "users.json");

let expensesByUser: Record<string, any[]> = {};
let users: Record<string, { email: string; password: string }> = {};

// ---------- Load or initialize users ----------
if (fs.existsSync(USERS_PATH)) {
    users = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
}

// ---------- Load CSVs for each user ----------
if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, ""); // placeholder
}

for (const email in users) {
    const file = getCsvFilePath(email);
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "date,description,amount,paid_by,split_between\n");
    } else {
        const raw: string[] = fs.readFileSync(file, "utf-8").trim().split("\n").slice(1);
        expensesByUser[email] = raw.map((line) => {
            const [date, description, amount, paid_by, splitRaw] = line.split(",");
            return {
                date: date.trim(),
                description: description.trim(),
                amount: parseFloat(amount),
                paid_by: paid_by.trim(),
                split_between: splitRaw.trim().split(";").map((s) => s.trim()),
            };
        });
    }
}

// ---------- Helpers ----------
function getCsvFilePath(email: string) {
    return path.join(__dirname, `expenses_${email.replace(/[^a-z0-9]/gi, "_")}.csv`);
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err || !decoded || typeof decoded !== "object" || !("email" in decoded)) {
            return res.status(403).json({ error: "Invalid token" });
        }
        (req as any).user = decoded.email;
        next();
    });
}

// ---------- Auth routes ----------
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (users[email]) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    users[email] = { email, password: hashed };
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    fs.writeFileSync(getCsvFilePath(email), "date,description,amount,paid_by,split_between\n");
    expensesByUser[email] = [];

    const token = jwt.sign({ email }, SECRET, { expiresIn: "1d" });
    res.json({ token });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = users[email];
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ email }, SECRET, { expiresIn: "1d" });
    res.json({ token });
});

// ---------- Protected routes ----------
app.get("/expenses", authMiddleware, (req, res) => {
    const email = (req as any).user;
    res.json(expensesByUser[email] || []);
});

app.post("/add-expense", authMiddleware, (req, res) => {
    const email = (req as any).user;
    const { date, description, amount, paid_by, split_between } = req.body;

    if (!date || !description || !amount || !paid_by || !Array.isArray(split_between)) {
        return res.status(400).json({ error: "Invalid data format" });
    }

    const row = `${date},${description},${amount},${paid_by},${split_between.join(";")}\n`;
    const file = getCsvFilePath(email);
    fs.appendFileSync(file, row);

    const newExpense = { date, description, amount, paid_by, split_between };
    expensesByUser[email] = expensesByUser[email] || [];
    expensesByUser[email].push(newExpense);

    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`✅ Auth-enabled server running at http://localhost:${PORT}`);
});
