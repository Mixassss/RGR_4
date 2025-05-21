import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/container.css";


const Home = () => {
    const [username, setUsername] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) setUsername(storedUsername);
    }, []);

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) return alert("Пароли не совпадают.");
        if (oldPassword === newPassword) return alert("Пароли совпадают.");
        if (newPassword.length < 4) return alert("Пароль слишком короткий.");

         try {
            const response = await api.put("/auth", {
                login: username,
                oldPassword: oldPassword,
                newPassword: newPassword
            });

            if (response.status === 200 && response.data.success) {
                console.log(response.data.message);
                alert("Пароль был успешно изменен!");
            } else {
                console.error("Ошибка при изменении пароля: ", response.data.message);
                alert(`Не удалось изменить пароль: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Ошибка при изменении пароля: ", error.response.data.message);
            alert(`Не удалось изменить пароль: ${error.response.data.message}`);
        }

        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleLogout = () => {
        sessionStorage.removeItem("username");
        localStorage.removeItem("username");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("accessToken");
        localStorage.removeItem("accessToken");
        navigate('/login');
    };

    return (
        <div className="container">
            <h2>Добро пожаловать!</h2>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link to="/upload">
                <button className="secondary">Загрузить конфигурацию реле</button>
            </Link>

            <button className="primary" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                {showPasswordForm ? "Скрыть смену пароля" : "Сменить пароль"}
            </button>
        </div>

        {showPasswordForm && (
        <>
            <h3>Смена пароля</h3>
            <input
                type="password"
                placeholder="Старый пароль"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
                type="password"
                placeholder="Новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
                type="password"
                placeholder="Повтор нового пароля"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
        <button className="primary" onClick={handleChangePassword}>Подтвердить смену пароля</button>
    </>
    )}

        <hr />
            <button className="danger" onClick={handleLogout}>Выйти</button>
        </div>
    );
};

export default Home;
