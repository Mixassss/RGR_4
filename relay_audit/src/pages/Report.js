import React, { useEffect, useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import "../styles/container.css";
import "../styles/Report.css";

const Report = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/relays");
      setReports(res.data);
    } catch (err) {
      setError("Не удалось загрузить отчеты");
      console.error("Ошибка загрузки отчетов:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Вы уверены, что хотите удалить отчет "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/relays/${id}`);
      setReports(reports.filter(report => report._id !== id));
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Не удалось удалить отчет");
    }
  };

  if (loading) return <div className="container">Загрузка отчетов...</div>;
  if (error) return <div className="container">{error}</div>;

return (
  <div className="container">
    <h2>Список отчетов</h2>

    <div className="reports-list">
      {reports.length === 0 ? (
        <p>Нет доступных отчетов</p>
      ) : (
        reports.map((report) => (
          <div key={report._id} className="report-card">
            <div className="report-info">
              <Link to={`/details/${report._id}`} className="report-link">
                {report.name} - {new Date(report.createdAt).toLocaleDateString()}
              </Link>
            </div>
            <button
              onClick={() => handleDelete(report._id, report.name)}
              className="danger delete-button"
            >
              Удалить
            </button>
          </div>
        ))
      )}
    </div>

    <div className="back-button-wrapper">
      <button onClick={() => navigate("/")} className="primary">
        На главную
      </button>
    </div>
  </div>
);
};

export default Report;