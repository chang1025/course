import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// 🔴 학생 데이터 API 주소 (이미지에 나온 스키마가 적용된 리소스)
const STUDENT_API_URL = "https://692ce8fae5f67cd80a4979ed.mockapi.io/student";

export default function Login() {
  const [inputStudentId, setInputStudentId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!inputStudentId) {
      setError("학번을 입력해주세요.");
      return;
    }

    try {
      // 1. MockAPI 필터링 검색
      // 주의: 이미지에 필드명이 'studentID'로 되어 있으므로 쿼리스트링도 정확히 맞춰야 합니다.
      const response = await axios.get(`${STUDENT_API_URL}?studentId=${inputStudentId}`);

      // 2. 데이터 존재 여부 확인
      if (response.data.length > 0) {
        const user = response.data[0]; // 검색된 사용자 정보 가져오기

        // 3. 로그인 성공 처리 (localStorage 저장)
        // 나중에 강의실 페이지에서 쓰기 위해 저장해둡니다.
        localStorage.setItem("loginId", user.id);
        localStorage.setItem("loginName", user.userName || "학생");

        // 4. ✨ 요청하신 알림창 띄우기
        alert("로그인되었습니다");

        // 5. 메인 페이지로 이동
        navigate("/list");
      } else {
        setError("존재하지 않는 학번입니다. (데이터를 확인해주세요)");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("서버 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ maxWidth: "400px", width: "100%" }}>
        <h3 className="text-center mb-4">🎓 수강신청 로그인</h3>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-bold">학번 (Student ID)</label>
            <input
              type="text"
              className="form-control"
              placeholder="예: 22000123"
              value={inputStudentId}
              onChange={(e) => setInputStudentId(e.target.value)}
            />
          </div>

          {error && <div className="alert alert-danger p-2 small">{error}</div>}

          <button type="submit" className="btn btn-primary btn-sm me-3">
            로그인
          </button>
          <Link to="/add" className="btn btn-primary btn-sm">
            회원가입
          </Link>
        </form>
      </div>
    </div>
  );
}