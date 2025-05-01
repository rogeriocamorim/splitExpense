import { useState, useEffect } from "react";
import {
    Typography,
    TextField,
    Button,
    Stack,
    Paper,
    Box,
    Collapse,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { calculateBalances, BalancesMap, Expense } from "./utils/balanceCalculator";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseTable from "./components/ExpenseTable";
import BalanceSummary from "./components/BalanceSummary";

export default function App() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [balances, setBalances] = useState<BalancesMap>({});
    const [members, setMembers] = useState<string[]>([]);
    const [newMember, setNewMember] = useState("");

    const [showExpenseForm, setShowExpenseForm] = useState(true);
    const [showMembersModal, setShowMembersModal] = useState(false);

    useEffect(() => {
        fetch("http://localhost:3001/expenses")
            .then((res) => res.json())
            .then((data) => setExpenses(data))
            .catch((err) => console.error("Failed to load expenses from server:", err));
    }, []);

    useEffect(() => {
        setBalances(calculateBalances(expenses));
        const deduped = Array.from(
            new Set(expenses.flatMap((e) => [e.paid_by, ...e.split_between]))
        );
        setMembers((prev) => Array.from(new Set([...prev, ...deduped])).sort());
    }, [expenses]);

    const handleAddExpense = async (expense: Expense) => {
        setExpenses((prev) => [...prev, expense]);
        try {
            await fetch("http://localhost:3001/add-expense", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(expense),
            });
        } catch (error) {
            console.error("Failed to save expense to server:", error);
        }
    };

    const handleAddMember = () => {
        const trimmed = newMember.trim();
        if (trimmed && !members.includes(trimmed)) {
            setMembers([...members, trimmed].sort());
            setNewMember("");
        }
    };

    const canRemoveMember = (name: string): boolean => {
        return !expenses.some(
            (exp) => exp.paid_by === name || exp.split_between.includes(name)
        );
    };

    const handleRemoveMember = (name: string) => {
        if (canRemoveMember(name)) {
            setMembers((prev) => prev.filter((m) => m !== name));
        }
    };

    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                pt: 6,
                px: 2,
                overflowY: "auto",
            }}
        >
            <Box sx={{ maxWidth: 1200, width: "100%" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4">💸 Split Expense Tracker</Typography>
                    <Button variant="outlined" onClick={() => setShowMembersModal(true)}>
                        Manage Members
                    </Button>
                </Stack>

                {members.length > 0 && (
                    <Stack direction={{ xs: "column", md: "row" }} spacing={3} mb={4}>
                        {/* Left: Expense Form */}
                        <Paper sx={{ flex: 1, p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Add a New Expense</Typography>
                                <IconButton onClick={() => setShowExpenseForm((prev) => !prev)}>
                                    {showExpenseForm ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Stack>
                            <Collapse in={showExpenseForm}>
                                <ExpenseForm
                                    onAddExpense={handleAddExpense}
                                    members={members}
                                    setMembers={setMembers}
                                />
                            </Collapse>
                        </Paper>

                        {/* Right: Expense Table + Summary */}
                        <Stack flex={1} spacing={3}>
                            <ExpenseTable expenses={expenses} />
                            <BalanceSummary expenses={expenses} />
                        </Stack>
                    </Stack>
                )}

                {/* Trip Members Modal */}
                <Dialog open={showMembersModal} onClose={() => setShowMembersModal(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Trip Members</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2}>
                            <TextField
                                label="Add member"
                                value={newMember}
                                onChange={(e) => setNewMember(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddMember();
                                    }
                                }}
                                placeholder="e.g. Rogerio"
                                fullWidth
                            />
                            {members.length > 0 && (
                                <Stack spacing={1}>
                                    {members.map((member) => {
                                        const removable = canRemoveMember(member);
                                        return (
                                            <Stack
                                                key={member}
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                            >
                                                <Typography>{member}</Typography>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    disabled={!removable}
                                                    onClick={() => handleRemoveMember(member)}
                                                >
                                                    Remove
                                                </Button>
                                            </Stack>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowMembersModal(false)}>Close</Button>
                        <Button variant="contained" onClick={handleAddMember}>
                            Add
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
}
