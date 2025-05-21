import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/container.css";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Выберите файл для загрузки.");
    if (!name) return alert("Введите название реле");

    setIsLoading(true);

    try {
      const fileContent = await new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.onerror = () => reject(new Error("Ошибка чтения файла"));
        fileReader.readAsText(file);
      });

      const config = JSON.parse(fileContent);
      
      // Отправка данных на сервер
      await api.post("/relays", {
        name: file.name.replace('.json', ''), // Используем имя файла
        configuration: config
      });

      // Автоматическое перенаправление на страницу отчетов
      navigate("/report");
      
    } catch (err) {
      console.error("Ошибка создания:", err);
      alert(`Ошибка: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = () => {
    navigate("/report");
  };

  return (
    <div className="container">
      <h2>Загрузить конфигурацию реле</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Название реле"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files[0])} 
          accept=".json" 
          required
        />
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button type="submit" className="primary" disabled={isLoading}>
            {isLoading ? "Загрузка..." : "Загрузить"}
          </button>
          <button type="button" className="primary" onClick={handleViewReport}>
            Просмотреть отчет
          </button>
        </div>
      </form>
    </div>
  );
};

export default Upload;