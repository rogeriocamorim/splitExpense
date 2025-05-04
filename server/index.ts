import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET!;

app.use(cors());
app.use(express.json());

interface AuthenticatedRequest extends Request {
    userEmail?: string;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    jwt.verify(token, SECRET, (err: jwt.VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
        if (err || !decoded || typeof decoded !== "object" || !("email" in decoded)) {
            return res.status(403).json({ error: "Invalid token" });
        }
        req.userEmail = decoded.email;
        next();
    });
}

app.post("/register", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, password: hash } });

    const token = jwt.sign({ email }, SECRET, { expiresIn: "1d" });
    res.json({ token });
});

app.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ email }, SECRET, { expiresIn: "1d" });
    res.json({ token });
});

app.get("/expenses", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userEmail) return res.status(401).json({ error: "Unauthorized" });

    const expenses = await prisma.expense.findMany({
        where: { userEmail: req.userEmail },
    });
    res.json(
        expenses.map((e) => ({
            ...e,
            split_between: JSON.parse(e.split_between),
        }))
    );
});

app.post("/add-expense", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userEmail) return res.status(401).json({ error: "Unauthorized" });

    const { date, description, amount, paid_by, split_between } = req.body;
    if (!date || !description || !amount || !paid_by || !Array.isArray(split_between)) {
        return res.status(400).json({ error: "Invalid data" });
    }

    await prisma.expense.create({
        data: {
            date,
            description,
            amount,
            paid_by,
            split_between: JSON.stringify(split_between),
            userEmail: req.userEmail,
        },
    });

    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`🚀 Prisma-backed server running at http://localhost:${PORT}`);
});
