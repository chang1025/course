import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// 🔴 학생 데이터 API (Login.js와 동일한 주소)
const STUDENT_API_URL = "https://692ce8fae5f67cd80a4979ed.mockapi.io/student";

export default function CourseAdd() {
  const [userName, setUserName] = useState("");
  const [studentId, setStudentId] = useState(""); // 소문자 studentId로 통일
  const navigate = useNavigate();

  // src/pages/CourseAdd.js 수정

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!userName || !studentId) {
      alert("이름과 학번을 모두 입력해주세요.");
      return;
    }

    try {
      // 🔍 [변경] 1. 검색 쿼리(?studentId=) 대신 '전체 목록'을 가져옵니다.
      // 이렇게 하면 주소 오류(404)인지 확실히 알 수 있고, 필터링 문제도 사라집니다.
      const response = await axios.get(STUDENT_API_URL);

      // 🔍 [변경] 2. 가져온 전체 목록에서 학번이 같은 사람이 있는지 '직접' 찾습니다.
      // (서버가 아니라 내 컴퓨터에서 비교하므로 훨씬 정확합니다)
      const existingUser = response.data.find(
        (user) => user.studentId === studentId || user.studentID === studentId
      );

      if (existingUser) {
        alert("이미 등록된 학번입니다. 로그인 페이지로 이동합니다.");
        navigate("/");
        return;
      }

      // 💾 3. 신규 가입 (POST) - 기존과 동일
      const newUser = {
        userName: userName,
        studentId: studentId,
        registeredCourses: []
      };

      await axios.post(STUDENT_API_URL, newUser);

      alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      navigate("/");

    } catch (error) {
      console.error("회원가입 에러:", error);
      // 404가 뜨면 URL 자체가 틀린 것입니다.
      if (error.response && error.response.status === 404) {
        alert(`API 주소가 잘못되었습니다. (404 Not Found)\nURL: ${STUDENT_API_URL}\n프로젝트 ID나 리소스 이름(student)을 확인해주세요.`);
      } else {
        alert("회원가입 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ maxWidth: "400px", width: "100%" }}>
        <h3 className="text-center mb-4">회원가입</h3>
        <form onSubmit={handleSignup}>
          <div className="mb-3">
            <label className="form-label fw-bold">이름 (User Name)</label>
            <input
              type="text"
              className="form-control"
              placeholder="이름을 입력하세요"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">학번 (Student ID)</label>
            <input
              type="text"
              className="form-control"
              placeholder="학번을 입력하세요 (예: 22000123)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-success w-100 mb-2">
            가입하기
          </button>
          <button
            type="button"
            className="btn btn-secondary w-100"
            onClick={() => navigate("/")}
          >
            취소 / 로그인으로 돌아가기
          </button>
        </form>
      </div>
    </div>
  );
}