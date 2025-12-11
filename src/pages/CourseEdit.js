import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// 🔴 학생 데이터 API 주소
const STUDENT_API_URL = "https://692ce8fae5f67cd80a4979ed.mockapi.io/student";

// 🎨 파스텔톤 색상 팔레트
const COLORS = [
  "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#A0C4FF", "#BDB2FF", "#FFC6FF", "#FFFFFC"
];

const getColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

// 🛠️ 유틸리티: 시간 문자열 파싱
const parseTimeSlots = (timeSlotsStr) => {
  if (!timeSlotsStr) return [];
  return timeSlotsStr.split(",").map(slot => {
    const match = slot.trim().match(/([A-Za-z]+)(\d+)/);
    if (match) return { day: match[1], period: parseInt(match[2]) };
    return null;
  }).filter(item => item !== null);
};

// 🛠️ 유틸리티: 특정 강의가 "새로 만들어지는 스케줄"과 충돌하는지 확인
const checkConflictWithSchedule = (schedule, targetCourse) => {
  const targetSlots = parseTimeSlots(targetCourse.timeSlots);
  
  return schedule.some(existing => {
    const existingSlots = parseTimeSlots(existing.timeSlots);
    return targetSlots.some(t => 
      existingSlots.some(e => e.day === t.day && e.period === t.period)
    );
  });
};

// 🛠️ 유틸리티: 두 강의 단독 비교 (교체 로직용)
const checkConflict = (courseA, courseB) => {
  const slotsA = parseTimeSlots(courseA.timeSlots);
  const slotsB = parseTimeSlots(courseB.timeSlots);

  return slotsA.some(a => 
    slotsB.some(b => a.day === b.day && a.period === b.period)
  );
};

export default function CourseEdit() {
  const [userData, setUserData] = useState(null);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [cartCourses, setCartCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editMemo, setEditMemo] = useState("");
  const [editRating, setEditRating] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const storedId = localStorage.getItem("loginId");
    if (!storedId) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/");
    }
  }, [navigate]);

  const fetchUserData = useCallback(async () => {
    const storedId = localStorage.getItem("loginId");
    if (!storedId) return;

    try {
      const response = await axios.get(`${STUDENT_API_URL}/${storedId}`);
      setUserData(response.data);
      setRegisteredCourses(response.data.registeredCourses || []);
      setCartCourses(response.data.shoppingCart || []);
      setLoading(false);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // --- 통계 계산 ---
  const stats = useMemo(() => {
    const total = registeredCourses.reduce((sum, c) => sum + (c.credit || 0), 0);
    const pfCount = registeredCourses.filter(c => c.gradeType === "PF" || c.pfOption === true).length;
    return { totalCredits: total, majorCredits: total, generalCredits: 0, pfCount: pfCount };
  }, [registeredCourses]);

  // --- 시간표 렌더링용 매핑 ---
  const timetableMap = useMemo(() => {
    const map = {};
    registeredCourses.forEach(course => {
      const slots = parseTimeSlots(course.timeSlots);
      slots.forEach(slot => {
        map[`${slot.day}-${slot.period}`] = course;
      });
    });
    return map;
  }, [registeredCourses]);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // --- 장바구니 -> 시간표 (교체 로직 적용) ---
  const addToTimetable = async (targetCourse) => {
    if (registeredCourses.some(c => c.originalId === targetCourse.originalId)) {
        alert("이미 시간표에 존재하는 강의입니다.");
        return;
    }

    const conflictingCourses = registeredCourses.filter(existing => 
      checkConflict(existing, targetCourse)
    );

    let confirmMsg = `[${targetCourse.courseName}] 강의를 시간표에 추가하시겠습니까?`;
    if (conflictingCourses.length > 0) {
      const conflictNames = conflictingCourses.map(c => c.courseName).join(", ");
      confirmMsg = `⚠️ 시간표의 [${conflictNames}] 강의와 시간이 겹칩니다.\n기존 강의를 장바구니로 내리고 교체하시겠습니까?`;
    }

    if (!window.confirm(confirmMsg)) return;

    const newRegistered = [
      ...registeredCourses.filter(c => !conflictingCourses.includes(c)), 
      targetCourse
    ];

    const newCart = [
      ...cartCourses.filter(c => c.uniqueId !== targetCourse.uniqueId), 
      ...conflictingCourses
    ];

    try {
        await axios.put(`${STUDENT_API_URL}/${userData.id}`, {
            ...userData,
            registeredCourses: newRegistered,
            shoppingCart: newCart
        });
        fetchUserData();
    } catch (e) {
        alert("저장 실패");
    }
  };

  // --- 강의 삭제/이동 ---
  const handleDelete = async (targetCourse, fromWhere) => {
      if(!window.confirm(`[${targetCourse.courseName}] 강의를 삭제하시겠습니까?`)) return;

      let newRegistered = registeredCourses;
      let newCart = cartCourses;

      if (fromWhere === 'timetable') {
          newRegistered = registeredCourses.filter(c => c.uniqueId !== targetCourse.uniqueId);
      } else {
          newCart = cartCourses.filter(c => c.uniqueId !== targetCourse.uniqueId);
      }

      try {
          await axios.put(`${STUDENT_API_URL}/${userData.id}`, {
              ...userData,
              registeredCourses: newRegistered,
              shoppingCart: newCart
          });
          fetchUserData();
      } catch (e) {
          alert("오류가 발생했습니다.");
      }
  };

  // --- 상세 정보 모달 ---
  const openDetailModal = (course) => {
    setEditingCourse(course);
    setEditMemo(course.memo || "");
    setEditRating(course.rating || 0);
    setShowModal(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    let isUpdated = false;
    
    const newRegistered = registeredCourses.map(c => {
      if (c.uniqueId === editingCourse.uniqueId) {
        isUpdated = true;
        return { ...c, memo: editMemo, rating: Number(editRating) };
      }
      return c;
    });

    const newCart = cartCourses.map(c => {
      if (c.uniqueId === editingCourse.uniqueId) {
        isUpdated = true;
        return { ...c, memo: editMemo, rating: Number(editRating) };
      }
      return c;
    });

    if (isUpdated) {
      try {
        await axios.put(`${STUDENT_API_URL}/${userData.id}`, {
            ...userData,
            registeredCourses: newRegistered,
            shoppingCart: newCart
        });
        alert("수정되었습니다.");
        setShowModal(false);
        fetchUserData();
      } catch (e) {
        alert("수정 실패");
      }
    }
  };

  // --- ✨ [수정 완료] MIX 기능: 전체 리셋 후 랜덤 재조합 ---
  const handleMix = async () => {
    const allCourses = [...registeredCourses, ...cartCourses];

    if (allCourses.length === 0) {
      alert("시간표와 장바구니가 모두 비어있습니다.");
      return;
    }

    if (!window.confirm("현재 시간표를 초기화하고, 모든 강의(시간표+장바구니)를 대상으로 랜덤 시간표를 생성하시겠습니까?")) return;

    // 1. 모든 강의를 후보군으로 합치고 랜덤 셔플
    // Math.random()을 이용해 순서를 무작위로 섞음
    const shuffledCandidates = [...allCourses].sort(() => Math.random() - 0.5);

    // 2. 새로운 시간표(newSchedule)와 장바구니(newCart) 초기화
    let newSchedule = [];
    let newCart = [];

    // 3. 앞에서부터 하나씩 집어서 시간표에 넣어봄 (Greedy)
    shuffledCandidates.forEach(candidate => {
      // 현재 만들고 있는 newSchedule과 충돌하는지 확인
      const isConflict = checkConflictWithSchedule(newSchedule, candidate);
      
      if (!isConflict) {
        // 충돌 안 하면 시간표에 등록
        newSchedule.push(candidate);
      } else {
        // 충돌 하면 장바구니로 다시 이동
        newCart.push(candidate);
      }
    });

    // 4. 결과 저장
    try {
      await axios.put(`${STUDENT_API_URL}/${userData.id}`, {
          ...userData,
          registeredCourses: newSchedule,
          shoppingCart: newCart
      });
      alert(`🎲 랜덤 조합 완료!\n총 ${newSchedule.length}개의 강의가 시간표에 배치되었습니다.`);
      fetchUserData();
    } catch (e) {
      alert("MIX 저장 실패");
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4 mb-5">
      {/* 상단 대시보드 */}
      <div className="row text-center mb-4 g-2">
        <div className="col-md-3">
            <div className="border rounded p-3 bg-white shadow-sm h-100">
                <span className="fs-2">📝</span><br/>
                <strong>총 학점</strong><br/>
                <span className="text-primary fw-bold fs-5">{stats.totalCredits} / 21</span>
            </div>
        </div>
         <div className="col-md-3">
            <div className="border rounded p-3 bg-white shadow-sm h-100">
                <span className="fs-2">📘</span><br/>
                <strong>전공</strong><br/>
                <span className="text-info fw-bold fs-5">{stats.majorCredits}</span>
            </div>
        </div>
        <div className="col-md-3">
            <div className="border rounded p-3 bg-white shadow-sm h-100">
                <span className="fs-2">📙</span><br/>
                <strong>교양</strong><br/>
                <span className="text-warning fw-bold fs-5">{stats.generalCredits}</span>
            </div>
        </div>
        <div className="col-md-3">
            <div className="border rounded p-3 bg-white shadow-sm h-100">
                <span className="fs-2">✅</span><br/>
                <strong>P/F 과목</strong><br/>
                <span className="text-success fw-bold fs-5">{stats.pfCount} 개</span>
            </div>
        </div>
      </div>

      {/* 시간표 영역 */}
      <div className="row">
        <div className="col-lg-12 mb-4 position-relative">
          <div className="position-absolute end-0 top-0 mb-2 me-3" style={{ zIndex: 10 }}>
             <button className="btn btn-primary shadow-sm" onClick={handleMix}>
                🔀 MIX
             </button>
          </div>

          <h4 className="fw-bold mb-3">📅 2025-1 시간표</h4>
          <div className="table-responsive bg-white rounded shadow-sm">
            <table className="table table-bordered text-center mb-0" style={{ tableLayout: 'fixed', height: '600px' }}>
              <thead className="bg-light">
                <tr>
                  <th style={{width: '60px'}}>Time</th>
                  <th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th>
                </tr>
              </thead>
              <tbody>
                {periods.map(period => (
                  <tr key={period}>
                    <td className="align-middle bg-light text-muted small fw-bold">{period}교시</td>
                    {days.map(day => {
                      const key = `${day}-${period}`;
                      const course = timetableMap[key];
                      return (
                        <td key={key} className="p-1 align-middle" style={{height: '60px', verticalAlign: 'middle'}}>
                          {course && (
                            <div 
                              className="rounded p-1 h-100 d-flex flex-column justify-content-center shadow-sm"
                              style={{ backgroundColor: getColor(course.courseName), fontSize: '0.8rem', cursor: 'pointer' }}
                              onClick={() => openDetailModal(course)}
                              title="클릭하여 상세정보/수정"
                            >
                              <div className="fw-bold text-truncate">{course.courseName}</div>
                              <div className="small text-truncate opacity-75">{course.classRoom}</div>
                            </div>
                          )}
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

      {/* 장바구니 영역 */}
      <div className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold text-muted">🛒 장바구니 (후보 강의)</h5>
            <Link to="/list" className="btn btn-sm btn-outline-primary">+ 강의 검색하러 가기</Link>
        </div>
        
        <div className="card bg-light border-0 shadow-sm p-3">
            {cartCourses.length === 0 ? (
                <p className="text-center text-muted m-0">장바구니가 비어있습니다.</p>
            ) : (
                <div className="d-flex flex-wrap gap-3">
                    {cartCourses.map(course => (
                        <div key={course.uniqueId} className="card border-0 shadow-sm" style={{ width: '250px' }}>
                            <div 
                                className="card-body p-3" 
                                style={{cursor: "pointer"}} 
                                onClick={(e) => {
                                    if(e.target.tagName !== "BUTTON") openDetailModal(course);
                                }}
                            >
                                <h6 className="card-title fw-bold text-truncate">{course.courseName}</h6>
                                <p className="card-text small text-muted mb-2">
                                    {course.professor} | {course.credit}학점<br/>
                                    {course.timeSlots}
                                </p>
                                <div className="d-flex gap-1">
                                    <button 
                                        className="btn btn-sm btn-primary flex-grow-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToTimetable(course);
                                        }}
                                    >
                                        🔼 올리기
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(course, 'cart');
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* 상세/수정 모달 */}
      {showModal && editingCourse && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">강의 상세 정보</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <h4>{editingCourse.courseName}</h4>
                <p className="text-muted mb-4">
                    {editingCourse.professor} | {editingCourse.credit}학점 | {editingCourse.classRoom}<br/>
                    시간: {editingCourse.timeSlots}
                </p>

                <div className="mb-3">
                  <label className="form-label">📝 메모</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={editMemo} 
                    onChange={(e) => setEditMemo(e.target.value)}
                    placeholder="이 강의에 대한 메모를 남기세요."
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">⭐ 나만의 별점</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0" max="5" 
                    value={editRating} 
                    onChange={(e) => setEditRating(e.target.value)} 
                  />
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <button 
                    className="btn btn-danger" 
                    onClick={() => {
                        const isInTable = registeredCourses.some(c => c.uniqueId === editingCourse.uniqueId);
                        handleDelete(editingCourse, isInTable ? 'timetable' : 'cart');
                        setShowModal(false);
                    }}
                >
                    삭제하기
                </button>
                <div>
                    <button className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>취소</button>
                    <button className="btn btn-success" onClick={handleUpdateCourse}>수정 저장</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}