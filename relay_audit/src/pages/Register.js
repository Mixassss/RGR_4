import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import "../styles/container.css";

const Register = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/auth/register", { login, password });
            alert("Регистрация прошла успешно!");
            navigate("/login");
        } catch (err) {
            alert("Ошибка регистрации: " + err.response?.data?.message || "Неизвестная ошибка.");
        }
    };

    return (
        <div className="container">
            <h2>Регистрация</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} required />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="primary">Зарегистрироваться</button>
            </form>
            <p>Если есть аккаунт <Link to="/login">Войти</Link></p>
        </div>
    );
};

export default Register;
