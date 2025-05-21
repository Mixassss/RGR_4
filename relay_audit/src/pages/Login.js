import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import "../styles/container.css";

const Login = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/login", { login, password });
            localStorage.setItem("accessToken", res.data.accessToken);
            localStorage.setItem("refreshToken", res.data.refreshToken);
            localStorage.setItem("username", login);
            navigate("/");
        } catch (err) {
            alert("Ошибка входа: " + err.response?.data?.message || "Неизвестная ошибка.");
        }
    };

    return (
        <div className="container">
            <h2>Вход</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} required />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="primary">Войти</button>
            </form>
            <p>Если нет аккаунта! <Link to="/register">Зарегистрироваться</Link></p>
        </div>
    );
};

export default Login;
