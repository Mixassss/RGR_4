import express from "express";
import Relay from "../mongo/relays.js";
import verifyToken from "./verifyToken.js";

const router = express.Router();

router.get("/:id", verifyToken, async (req, res) => {
    try {
        const relay = await Relay.findById(req.params.id);
        if (!relay) return res.status(404).json({ message: "Конфигурация не найдена" });

        const config = relay.configuration;
        const issues = [];

        // Проверка стандартных параметров
        if (config.tripTime > 100) issues.push("tripTime превышает допустимое значение (> 100 мс)");
        if (!["auto", "manual"].includes(config.mode)) issues.push("Неверный режим работы (mode)");
        if (config.voltageLevel < 110) issues.push("Напряжение ниже допустимого уровня (< 110 В)");

        // Дополнительные проверки
        if (config.currentThreshold !== undefined) {
            if (config.currentThreshold < 5 || config.currentThreshold > 100)
                issues.push("Порог срабатывания по току (currentThreshold) вне диапазона 5–100 A");
        }

        if (config.sensitivity !== undefined) {
            if (config.sensitivity < 0.1 || config.sensitivity > 1.0)
                issues.push("Чувствительность (sensitivity) вне допустимого диапазона 0.1–1.0");
        }

        if (config.delay !== undefined) {
            if (config.delay < 0 || config.delay > 10)
                issues.push("Задержка (delay) превышает допустимое значение (0–10 с)");
        }

        res.json({
            result: issues.length ? "Обнаружены отклонения" : "Отклонений не найдено",
            issues
        });
    } catch (err) {
        res.status(500).json({ message: "Ошибка при выполнении аудита" });
    }
});

export default router;