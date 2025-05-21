import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/container.css";
import { FaUserCircle } from "react-icons/fa";


const Home = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Добро пожаловать!</h2>

                {/* Иконка пользователя с переходом */}
                <Link to="/profile" style={{ fontSize: '2rem', color: '#fff' }} title="Профиль">
                    <FaUserCircle />
                </Link>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link to="/upload">
                    <button className="secondary">Загрузить конфигурацию реле</button>
                </Link>
            </div>

            <hr />
            <button className="danger" onClick={handleLogout}>Выйти</button>
        </div>
    );
};

export default Home;
