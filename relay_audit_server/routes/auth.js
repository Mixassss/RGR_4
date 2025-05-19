import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../mongo/users.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'default_access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

router.post("/register", async (req, res) => {
    try {
        const { login, password } = req.body;
        const existing = await User.findOne({ login });
        if (existing) return res.status(400).json({ message: "Пользователь уже существует" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ login, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "Регистрация прошла успешно" });
    } catch (err) {
        res.status(500).json({ message: "Ошибка при регистрации" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { login, password } = req.body;
        if (!login || !password) {
            return res.status(400).json({ message: "Логин и пароль обязательны" });
        }

        const user = await User.findOne({ login });
        if (!user) {
            return res.status(401).json({ message: "Неверные учетные данные" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: "Неверный пароль" });
        }

        const payload = { _id: user._id, login: user.login };
        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
        const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

        res.json({ accessToken, refreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Ошибка при авторизации" });
    }
});

router.put('/', async (req, res) => {
    const {login, oldPassword, newPassword} = req.body;
    try {
        const user = await User.findOne({ login });
        if (!user) {
            return res.status(404).json({success: false, message: "Пользователь не найден в базе данных!"});
        }
        const checkPassword = await bcrypt.compare(oldPassword, user.password);
        if (!checkPassword) {
            return res.status(403).json({success: false, message: "Старый пароль неверный!"});
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();
        res.status(200).json({success: true, message: "Пароль успешно обновлён!"});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: "Ошибка сервера!"});
    }
});


router.post("/refresh-token", (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: "Отсутствует refresh token" });
        }

        jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Неверный refresh token" });
            }

            const payload = { _id: user._id, login: user.login };
            const newAccessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
            res.json({ accessToken: newAccessToken });
        });
    } catch (err) {
        res.status(500).json({ message: "Ошибка при обновлении токена" });
    }
});

export default router;