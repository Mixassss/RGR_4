import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Types } from "mongoose";
import Relay from "../mongo/relays.js";
import verifyToken from "./verifyToken.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Валидация ID реле
const isValidId = (id) => Types.ObjectId.isValid(id);

// Сохранение отчета в файл с обработкой ошибок
const saveRelayReport = (relayData, relayId) => {
    try {
        const reportsDir = path.join(__dirname, "../reports");
        
        // Создаем директорию, если не существует
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true, mode: 0o755 });
        }

        const reportPath = path.join(reportsDir, `${relayId}_report.json`);
        fs.writeFileSync(reportPath, JSON.stringify(relayData, null, 2), { flag: 'w' });
        return reportPath;
    } catch (err) {
        console.error("Ошибка сохранения отчета:", err);
        throw new Error("Не удалось сохранить файл отчета");
    }
};

// Проверка конфигурации реле
const validateConfiguration = (config) => {
    const errors = [];
    
    if (typeof config.tripTime !== 'number' || config.tripTime < 0 || config.tripTime > 1000) {
        errors.push("tripTime должен быть числом от 0 до 1000");
    }
    
    if (!['auto', 'manual'].includes(config.mode)) {
        errors.push("mode должен быть 'auto' или 'manual'");
    }
    
    if (typeof config.voltageLevel !== 'number' || config.voltageLevel <= 0) {
        errors.push("voltageLevel должен быть положительным числом");
    }
    
    if (config.currentThreshold && (config.currentThreshold < 5 || config.currentThreshold > 100)) {
        errors.push("currentThreshold должен быть от 5 до 100");
    }
    
    if (config.sensitivity && (config.sensitivity < 0.1 || config.sensitivity > 1.0)) {
        errors.push("sensitivity должен быть от 0.1 до 1.0");
    }
    
    if (config.delay && (config.delay < 0 || config.delay > 10)) {
        errors.push("delay должен быть от 0 до 10");
    }
    
    return errors.length > 0 ? errors : null;
};

// Создание нового реле
router.post("/", verifyToken, async (req, res) => {
    try {
        const { name, configuration } = req.body;

        if (!name || !configuration) {
            return res.status(400).json({ message: "Необходимо указать name и configuration" });
        }

        const configErrors = validateConfiguration(configuration);
        if (configErrors && configErrors.length > 0) {
            console.warn("В конфигурации обнаружены потенциальные нарушения:", configErrors);
        }

        // Сначала создаём и сохраняем реле
        const relay = new Relay({
            name,
            configuration,
            uploadedBy: req.user._id,
            reportFilePath: "" // пока пусто
        });
        await relay.save(); 

        try {
            const reportFilePath = saveRelayReport(
                {
                    name,
                    configuration,
                    uploadedBy: req.user._id,
                    createdAt: relay.createdAt
                },
                relay._id
            );

            relay.reportFilePath = reportFilePath;
            await relay.save(); // обновляем путь к отчёту

        } catch (err) {
            console.error("Ошибка сохранения отчета:", err);
            return res.status(500).json({ message: "Ошибка при создании отчета" });
        }

        res.status(201).json({
            _id: relay._id,
            name: relay.name,
            configuration: relay.configuration,
            createdAt: relay.createdAt,
            reportUrl: `/api/relays/${relay._id}/report`
        });

    } catch (err) {
        console.error("Ошибка создания реле:", err);
        res.status(500).json({
            message: "Ошибка при создании реле",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Получение списка реле пользователя
router.get("/", verifyToken, async (req, res) => {
    try {
        const relays = await Relay.find({ uploadedBy: req.user._id })
            .select("-__v -uploadedBy")
            .sort({ createdAt: -1 });
            
        res.json(relays);
    } catch (err) {
        console.error("Ошибка получения списка реле:", err);
        res.status(500).json({ message: "Ошибка при получении списка реле" });
    }
});

// Получение конкретного реле
router.get("/:id", verifyToken, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Некорректный ID реле" });
        }
        
        const relay = await Relay.findOne({ 
            _id: req.params.id, 
            uploadedBy: req.user._id 
        }).select("-__v");
        
        if (!relay) {
            return res.status(404).json({ message: "Реле не найдено" });
        }
        
        res.json(relay);
    } catch (err) {
        console.error("Ошибка получения реле:", err);
        res.status(500).json({ message: "Ошибка при получении реле" });
    }
});

// Получение отчета реле
router.get("/:id/report", verifyToken, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Некорректный ID реле" });
        }
        
        const relay = await Relay.findOne({
            _id: req.params.id,
            uploadedBy: req.user._id
        });
        
        if (!relay) {
            return res.status(404).json({ message: "Реле не найдено" });
        }
        
        if (!fs.existsSync(relay.reportFilePath)) {
            return res.status(404).json({ message: "Файл отчета не найден" });
        }
        
        const reportContent = fs.readFileSync(relay.reportFilePath, 'utf-8');
        const reportData = JSON.parse(reportContent);
        
        // Формируем стандартизированный отчет
        const violations = [];
        const { configuration } = relay;
        
        if (configuration.tripTime > 100) {
            violations.push({
                parameter: "tripTime",
                actual: configuration.tripTime,
                expected: "≤ 100",
                severity: "high",
                message: "Время срабатывания превышает допустимое значение"
            });
        }

        if (configuration.voltageLevel < 110) {
            violations.push({
                parameter: "voltageLevel",
                actual: configuration.voltageLevel,
                expected: "≥ 110",
                severity: "medium",
                message: "Уровень напряжения ниже допустимого"
            });
        }

        if (configuration.currentThreshold < 0.5 || configuration.currentThreshold > 5.0) {
            violations.push({
                parameter: "currentThreshold",
                actual: configuration.currentThreshold,
                expected: "0.5 – 5.0",
                severity: "high",
                message: "Порог тока выходит за пределы допустимого диапазона"
            });
        }

        if (configuration.sensitivity < 0.1 || configuration.sensitivity > 1.0) {
            violations.push({
                parameter: "sensitivity",
                actual: configuration.sensitivity,
                expected: "0.1 – 1.0",
                severity: "low",
                message: "Чувствительность не в пределах допустимого диапазона"
            });
        }

        if (configuration.delay < 0 || configuration.delay > 10) {
            violations.push({
                parameter: "delay",
                actual: configuration.delay,
                expected: "0 – 10",
                severity: "medium",
                message: "Задержка выхода должна быть от 0 до 10 секунд"
            });
        }
        
        res.json({
            filename: relay.name,
            analyzedAt: relay.createdAt,
            configuration: relay.configuration,
            violations,
            reportStatus: violations.length ? "has_issues" : "valid"
        });
        
    } catch (err) {
        console.error("Ошибка получения отчета:", err);
        res.status(500).json({ 
            message: "Ошибка при получении отчета",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Обновление реле
router.put("/:id", verifyToken, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Некорректный ID реле" });
        }
        
        // Валидация обновляемой конфигурации
        if (req.body.configuration) {
            const configErrors = validateConfiguration(req.body.configuration);
            if (configErrors) {
                return res.status(400).json({ 
                    message: "Ошибки валидации конфигурации",
                    errors: configErrors 
                });
            }
        }
        
        const updated = await Relay.findOneAndUpdate(
            { _id: req.params.id, uploadedBy: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ message: "Реле не найдено" });
        }
        
        res.json(updated);
    } catch (err) {
        console.error("Ошибка обновления реле:", err);
        res.status(500).json({ message: "Ошибка при обновлении реле" });
    }
});

// Удаление реле
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Некорректный ID реле" });
    }

    const relay = await Relay.findOneAndDelete({ 
      _id: req.params.id, 
      uploadedBy: req.user._id 
    });

    if (!relay) {
      return res.status(404).json({ message: "Реле не найдено" });
    }

    // Удаление файла отчета
    try {
      if (fs.existsSync(relay.reportFilePath)) {
        fs.unlinkSync(relay.reportFilePath);
      }
    } catch (err) {
      console.error("Ошибка удаления файла отчета:", err);
    }

    res.json({ message: "Отчет успешно удален" });
  } catch (err) {
    console.error("Ошибка удаления реле:", err);
    res.status(500).json({ message: "Ошибка при удалении отчета" });
  }
});

export default router;