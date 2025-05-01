import { useState } from "react";
import {
    Box,
    Button,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    InputLabel,
    FormControl,
    OutlinedInput,
    Checkbox,
    ListItemText,
    InputAdornment,
} from "@mui/material";
import { Expense } from "../utils/balanceCalculator";

interface Props {
    onAddExpense: (expense: Expense) => void;
    members: string[];
    setMembers: (members: string[]) => void;
}

export default function ExpenseForm({ onAddExpense, members = []}: Props) {
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState<number | "">("");
    const [paidBy, setPaidBy] = useState("");
    const [splitBetween, setSplitBetween] = useState<string[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !description || !amount || !paidBy || splitBetween.length === 0) return;

        const expense: Expense = {
            date,
            description,
            amount: Number(amount),
            paid_by: paidBy,
            split_between: splitBetween,
        };

        onAddExpense(expense);

        // Reset
        setDate("");
        setDescription("");
        setAmount("");
        setPaidBy("");
        setSplitBetween([]);
    };

    return (
        <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <TextField
                        type="date"
                        label="Date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                        required
                    />
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                    <TextField
                        type="number"
                        label="Amount"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        required
                        slotProps={{
                            input: {
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            },
                        }}
                    />
                    <FormControl required>
                        <InputLabel>Paid by</InputLabel>
                        <Select
                            value={paidBy}
                            label="Paid by"
                            onChange={(e) => setPaidBy(e.target.value)}
                        >
                            {members.map((name) => (
                                <MenuItem key={name} value={name}>
                                    {name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl required>
                        <InputLabel>Split between</InputLabel>
                        <Select
                            multiple
                            value={splitBetween}
                            onChange={(e) => setSplitBetween(e.target.value as string[])}
                            input={<OutlinedInput label="Split between" />}
                            renderValue={(selected) => selected.join(", ")}
                        >
                            {members.map((name) => (
                                <MenuItem key={name} value={name}>
                                    <Checkbox checked={splitBetween.includes(name)} />
                                    <ListItemText primary={name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button type="submit" variant="contained" color="primary">
                        Add Expense
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );
}
