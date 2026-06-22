import { Router } from "express";
import {
    getCurrentUser,
    login,
    logout,
    register,
} from "../controllers/auth.controller";
import {
    googleAuth,
    googleCallback,
} from "../controllers/googleAuth.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// POST /api/auth/register
router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getCurrentUser);
router.post("/logout", verifyToken, logout);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;
