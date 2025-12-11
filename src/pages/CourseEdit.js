import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// 🔴 학생 데이터 API 주소
const STUDENT_API_URL = "https://692ce8fae5f67cd80a4979ed.mockapi.io/student";

// 🎨 시간표용 색상 팔레트
const COLORS = [
  "#FFDDC1", "#FFABAB", "#FFC3A0", "#D5AAFF", "#85E3FF",
  "#B9FBC0", "#F9F871", "#E2F0CB", "#FF9AA2", "#C7CEEA"
];

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
      navigate("/login");
    } else {
      setCurrentUserId(storedId);
    }
  }, [navigate]);

  // --- 2. 데이터 불러오기 (Read) ---
  const fetchMyCourses = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const response = await axios.get(`${STUDENT_API_URL}/${currentUserId}`);
      setUserData(response.data);

      // 가져온 강의들에 색상 부여
      const coursesWithColor = (response.data.registeredCourses || []).map((course, index) => ({
        ...course,
        color: COLORS[index % COLORS.length]
      }));

      setMyCourses(coursesWithColor);
      setLoading(false);
    } catch (error) {
      console.error("로딩 실패:", error);
      alert("데이터를 불러오지 못했습니다.");
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  // --- 3. 강의 삭제 ---
  const handleDelete = async (targetUniqueId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const updatedCourses = myCourses.filter(c => c.uniqueId !== targetUniqueId);

      await axios.put(`${STUDENT_API_URL}/${currentUserId}`, {
        ...userData,
        registeredCourses: updatedCourses
      });

      alert("삭제되었습니다.");
      fetchMyCourses();
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

  // --- 5. 강의 수정 ---
  const handleUpdate = async () => {
    if (!editingCourse) return;

    try {
      const updatedCourses = myCourses.map(course => {
        if (course.uniqueId === editingCourse.uniqueId) {
          return { ...course, memo: editMemo, rating: Number(editRating) };
        }
        return course;
      });

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

  // --- 🕒 시간표 데이터 처리 로직 ---
  const getTimetableData = () => {
    const timetableMap = {};

    myCourses.forEach((course) => {
      if (!course.timeSlots) return;
      const slots = course.timeSlots.split(",");

      slots.forEach((slot) => {
        const trimmedSlot = slot.trim();
        const match = trimmedSlot.match(/([A-Za-z]+)(\d+)/);
        if (match) {
          const day = match[1];
          const period = match[2];
          timetableMap[`${day}-${period}`] = course;
        }
      });
    });
    return timetableMap;
  };

  const timetableData = getTimetableData();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dayLabels = { "Mon": "월", "Tue": "화", "Wed": "수", "Thu": "목", "Fri": "금" };
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const totalCredits = myCourses.reduce((sum, c) => sum + (c.credit || 0), 0);

  if (loading) return <div className="text-center mt-5">로딩 중...</div>;

  return (
    <div className="container mt-4">
      {/* 상단 헤더 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">🏫 내 강의실 ({userData.userName || "학생"}님)</h2>
        <Link to="/list" className="btn btn-primary">+ 강의 더 담기</Link>
      </div>

      {/* 상태 요약 바 */}
      <div className="alert alert-success mb-4">
        <strong>신청 과목:</strong> {myCourses.length}개 / <strong>총 학점:</strong> {totalCredits}학점
      </div>

      <div className="row">
        {/* --- [좌측] 주간 시간표 영역 --- */}
        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white fw-bold">📅 주간 시간표</div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered text-center mb-0" style={{ tableLayout: "fixed" }}>
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: "60px" }}>교시</th>
                      {days.map(day => <th key={day}>{dayLabels[day]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(period => (
                      <tr key={period} style={{ height: "70px" }}>
                        <td className="align-middle bg-light text-muted small fw-bold">{period}</td>
                        {days.map(day => {
                          const course = timetableData[`${day}-${period}`];
                          return (
                            <td key={`${day}-${period}`} className="p-1 align-middle" style={{ verticalAlign: "middle" }}>
                              {course ? (
                                // ✨ [수정됨] onClick 이벤트 추가 및 커서 스타일 변경 ✨
                                <div
                                  className="rounded p-1 shadow-sm h-100 d-flex flex-column justify-content-center course-cell"
                                  style={{
                                    backgroundColor: course.color,
                                    fontSize: "0.8rem",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    transition: "transform 0.1s"
                                  }}
                                  onClick={() => openEditModal(course)}
                                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                  title="클릭하여 수정"
                                >
                                  <div className="fw-bold text-truncate">{course.courseName}</div>
                                  <div className="text-muted text-truncate" style={{ fontSize: "0.7rem" }}>{course.classRoom}</div>
                                </div>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* --- [우측] 강의 목록 리스트 영역 --- */}
        <div className="col-lg-4">
          <h5 className="fw-bold mb-3">📋 강의 목록</h5>
          <div className="d-flex flex-column gap-3" style={{ maxHeight: "700px", overflowY: "auto" }}>
            {myCourses.length > 0 ? (
              myCourses.map((course) => (
                <div className="card shadow-sm border-0" key={course.uniqueId}>
                  <div className="card-body p-3 border-start border-4" style={{ borderColor: course.color }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <h6 className="card-title fw-bold mb-1 text-truncate" style={{ maxWidth: "70%" }}>{course.courseName}</h6>
                      <span className="badge bg-light text-dark border">{course.classNumber}분반</span>
                    </div>
                    <p className="text-muted small mb-1">{course.professor} | {course.credit}학점</p>
                    <p className="text-muted small mb-2">{course.timeSlots} ({course.classRoom})</p>

                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                      <div className="text-warning small fw-bold">★ {course.rating || "-"}</div>
                      <div className="d-flex gap-1">
                        <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: "0.8rem" }} onClick={() => openEditModal(course)}>수정</button>
                        <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{ fontSize: "0.8rem" }} onClick={() => handleDelete(course.uniqueId)}>삭제</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted border rounded bg-light">
                아직 담은 강의가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">강의 정보 수정</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>{editingCourse?.courseName}</strong></p>
                <div className="mb-3">
                  <label>메모</label>
                  <textarea className="form-control" rows="3" value={editMemo} onChange={(e) => setEditMemo(e.target.value)}></textarea>
                </div>
                <div className="mb-3">
                  <label>내 평점</label>
                  <input type="number" className="form-control" min="1" max="5" value={editRating} onChange={(e) => setEditRating(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button className="btn btn-primary" onClick={handleUpdate}>수정 완료</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}