import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const CSV_PATH = path.join(__dirname, "expenses.csv");
let expenses: any[] = [];

// Ensure CSV exists with headers
if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, "date,description,amount,paid_by,split_between\n");
} else {
    // Load existing expenses from CSV
    const fileData = fs.readFileSync(CSV_PATH, "utf-8");
    const lines = fileData.trim().split("\n").slice(1); // skip header

    expenses = lines.map((line) => {
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

// GET all expenses
app.get("/expenses", (_req, res) => {
    res.json(expenses);
});

// POST a new expense
app.post("/add-expense", (req, res) => {
    const { date, description, amount, paid_by, split_between } = req.body;

    if (!date || !description || !amount || !paid_by || !Array.isArray(split_between)) {
        return res.status(400).json({ error: "Invalid data format" });
    }

    const row = `${date},${description},${amount},${paid_by},${split_between.join(";")}\n`;
    fs.appendFileSync(CSV_PATH, row);

    expenses.push({ date, description, amount, paid_by, split_between });

    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
