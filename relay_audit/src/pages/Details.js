import React, { useEffect, useState } from "react";
import api from "../api";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/container.css";

const Details = () => {
  const { fileId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/relays/${fileId}/report`);
        setReport(res.data);
      } catch (err) {
        console.error("Ошибка загрузки отчета:", err);
        alert("Не удалось загрузить отчет");
        navigate("/report");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [fileId]);

  if (loading) return <div className="container">Загрузка отчета...</div>;
  if (!report) return <div className="container">Отчет не найден</div>;

  return (
    <div className="container">
      <h2>Отчет: {report.filename}</h2>
      <p>Дата создания: {new Date(report.analyzedAt).toLocaleString()}</p>
      
      <h3>Параметры конфигурации:</h3>
      <pre>{JSON.stringify(report.configuration, null, 2)}</pre>
      
      <h3>Нарушения:</h3>
      {report.violations?.length > 0 ? (
        <ul>
          {report.violations.map((v, idx) => (
            <li key={idx} className={`violation ${v.severity}`}>
              <strong>{v.parameter}:</strong> {v.actual} (ожидается: {v.expected})
            </li>
          ))}
        </ul>
      ) : (
        <p>Нарушений не обнаружено</p>
      )}
      
      <button onClick={() => navigate("/report")} className="primary">
        Вернуться к списку
      </button>
    </div>
  );
};

export default Details;