import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connect } from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import relayRoutes from "./routes/relay.js";
import auditRoutes from "./routes/audit.js";

dotenv.config();
const app = express();

// CSP — защита от XSS
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self';"
  );
  next();
});

// Получаем текущую директорию
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Создаем необходимые папки
const reportsDir = path.join(__dirname, "reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Маршруты
app.use("/api/auth", authRoutes);
app.use("/api/relays", relayRoutes);
app.use("/api/audit", auditRoutes);

// Подключение к MongoDB
connect(process.env.MONGODB_URI || "mongodb://localhost:27017/RelayAudit", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB подключена"))
  .catch(err => console.error("❌ Ошибка подключения к MongoDB:", err));

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
