import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; // useNavigate 추가
import "bootstrap/dist/css/bootstrap.min.css";

// 🔴 학생 데이터 API 주소 (Login.js와 프로젝트 ID가 일치하는지 꼭 확인하세요!)
const STUDENT_API_URL = "https://692ce8fae5f67cd80a4979ed.mockapi.io/student";

export default function CourseEdit() {
  const [myCourses, setMyCourses] = useState([]);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  // 🟢 로그인한 사용자 ID 상태 관리
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  // 수정 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editMemo, setEditMemo] = useState("");
  const [editRating, setEditRating] = useState(0);

  // --- 1. 로그인 체크 및 ID 불러오기 ---
  useEffect(() => {
    const storedId = localStorage.getItem("loginId");

    if (!storedId) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login"); // 로그인 페이지로 리다이렉트
    } else {
      setCurrentUserId(storedId);
    }
  }, [navigate]);

  // --- 2. 데이터 불러오기 (Read) ---
  const fetchMyCourses = useCallback(async () => {
    if (!currentUserId) return; // ID가 없으면 실행하지 않음

    try {
      // 저장된 currentUserId를 사용하여 해당 유저의 데이터만 가져옴
      const response = await axios.get(`${STUDENT_API_URL}/${currentUserId}`);
      setUserData(response.data);
      setMyCourses(response.data.registeredCourses || []);
      setLoading(false);
    } catch (error) {
      console.error("로딩 실패:", error);
      alert("데이터를 불러오지 못했습니다.");
      setLoading(false);
    }
  }, [currentUserId]); // currentUserId가 설정된 후 실행됨

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  // --- 3. 강의 삭제 (배열 조작 후 PUT) ---
  const handleDelete = async (targetUniqueId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const updatedCourses = myCourses.filter(c => c.uniqueId !== targetUniqueId);

      // currentUserId를 사용하여 업데이트
      await axios.put(`${STUDENT_API_URL}/${currentUserId}`, {
        ...userData,
        registeredCourses: updatedCourses
      });

      alert("삭제되었습니다.");
      fetchMyCourses(); // 새로고침
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // --- 4. 수정 모달 열기 ---
  const openEditModal = (course) => {
    setEditingCourse(course);
    setEditMemo(course.memo || "");
    setEditRating(course.rating || 5);
    setShowModal(true);
  };

  // --- 5. 강의 수정 (배열 조작 후 PUT) ---
  const handleUpdate = async () => {
    if (!editingCourse) return;

    try {
      const updatedCourses = myCourses.map(course => {
        if (course.uniqueId === editingCourse.uniqueId) {
          return { ...course, memo: editMemo, rating: Number(editRating) };
        }
        return course;
      });

      // currentUserId를 사용하여 업데이트
      await axios.put(`${STUDENT_API_URL}/${currentUserId}`, {
        ...userData,
        registeredCourses: updatedCourses
      });

      alert("수정되었습니다!");
      setShowModal(false);
      fetchMyCourses();
    } catch (error) {
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  // 총 학점 계산
  const totalCredits = myCourses.reduce((sum, c) => sum + (c.credit || 0), 0);

  if (loading) return <div className="text-center mt-5">로딩 중...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">🏫 내 강의실 ({userData.userName || "학생"}님)</h2>
        <Link to="/list" className="btn btn-outline-primary">+ 강의 더 담기</Link>
      </div>

      <div className="alert alert-success">
        <strong>신청 과목:</strong> {myCourses.length}개 / <strong>총 학점:</strong> {totalCredits}학점
      </div>

      <div className="row g-4">
        {myCourses.length > 0 ? (
          myCourses.map((course) => (
            <div className="col-md-6 col-lg-4" key={course.uniqueId}>
              <div className="card h-100 shadow-sm">
                <div className="card-header d-flex justify-content-between bg-light">
                  <span className="badge bg-info text-dark">{course.classNumber}분반</span>
                  <span className="small text-muted">{course.gradeType}</span>
                </div>
                <div className="card-body">
                  <h5 className="card-title fw-bold text-primary">{course.courseName}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">{course.professor}</h6>
                  <p className="small mb-1">⏰ {course.timeSlots}</p>
                  <p className="small mb-3">🏫 {course.classRoom}</p>
                  <div className="bg-light p-2 rounded mb-2">
                    <small className="d-block text-muted">📝 {course.memo || "메모 없음"}</small>
                  </div>
                  <div className="fw-bold text-warning">★ {course.rating}</div>
                </div>
                <div className="card-footer bg-white border-top-0 d-flex justify-content-end gap-2 pb-3">
                  <button className="btn btn-outline-warning btn-sm" onClick={() => openEditModal(course)}>수정</button>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(course.uniqueId)}>삭제</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5 text-muted">아직 담은 강의가 없습니다.</div>
        )}
      </div>

      {/* 수정 모달 */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">정보 수정</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>{editingCourse?.courseName}</strong></p>
                <div className="mb-3">
                  <label>메모</label>
                  <textarea className="form-control" rows="3" value={editMemo} onChange={(e) => setEditMemo(e.target.value)}></textarea>
                </div>
                <div className="mb-3">
                  <label>평점</label>
                  <input type="number" className="form-control" min="1" max="5" value={editRating} onChange={(e) => setEditRating(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button className="btn btn-success" onClick={handleUpdate}>수정 완료</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}