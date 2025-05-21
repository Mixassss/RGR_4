import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/container.css";

const Profile = () => {
    const navigate = useNavigate(); // ✅ Добавили useNavigate

    const [username, setUsername] = useState('');
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        patronymic: ''
    });
    const [editMode, setEditMode] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) {
            setUsername(storedUsername);
            fetchUserData(storedUsername);
        }
    }, []);

    const fetchUserData = async (login) => {
        try {
            const response = await api.get(`/auth/profile/${login}`);
            if (response.data.success) {
                setUserData({
                    firstName: response.data.user.firstName || '',
                    lastName: response.data.user.lastName || '',
                    patronymic: response.data.user.patronymic || ''
                });
            }
        } catch (err) {
            console.error("Ошибка при загрузке данных пользователя", err);
        }
    };

    const handleChangeUserData = async () => {
        try {
            const cleanData = {};
            Object.entries(userData).forEach(([key, value]) => {
                if (value.trim() !== "") {
                    cleanData[key] = value.trim();
                }
            });

            const response = await api.put(`/auth/profile/${username}`, cleanData);

            if (response.data.success) {
                alert("Данные успешно обновлены");
                setEditMode(false);
            }
        } catch (err) {
            alert("Ошибка при обновлении данных");
            console.error(err);
        }
    };

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
                alert("Пароль был успешно изменен!");
            } else {
                alert(`Не удалось изменить пароль: ${response.data.message}`);
            }
        } catch (error) {
            alert(`Не удалось изменить пароль: ${error.response?.data?.message || error.message}`);
        }

        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="container">
            {/* ✅ Кнопка "Назад" */}
            <button className="secondary" onClick={() => navigate("/")}>
                ⬅ Назад на главную
            </button>

            <h2>Профиль</h2>

            <h3>Личные данные</h3>
            <input
                type="text"
                placeholder="Имя"
                value={userData.firstName}
                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                disabled={!editMode}
            />
            <input
                type="text"
                placeholder="Фамилия"
                value={userData.lastName}
                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                disabled={!editMode}
            />
            <input
                type="text"
                placeholder="Отчество"
                value={userData.patronymic}
                onChange={(e) => setUserData({ ...userData, patronymic: e.target.value })}
                disabled={!editMode}
            />

            {!editMode ? (
                <button className="primary" onClick={() => setEditMode(true)}>Изменить данные</button>
            ) : (
                <button className="primary" onClick={handleChangeUserData}>Подтвердить</button>
            )}

            <hr />

            <div style={{ marginBottom: "10px" }}>
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
        </div>
    );
};

export default Profile;
