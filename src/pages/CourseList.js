import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// 1. API 엔드포인트
const CATALOG_API_URL = "https://692ce8f1e5f67cd80a4979c8.mockapi.io/course";
// 🔴 Login.js, CourseEdit.js와 동일한 프로젝트 ID인지 꼭 확인해주세요!
const STUDENT_API_URL = "https://692ce8fae5f67cd80a4979ed.mockapi.io/student";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);

  // 🟢 로그인한 사용자 ID 상태
  const [currentUserId, setCurrentUserId] = useState(null);

  // 필터 및 검색 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState("all");

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [inputMemo, setInputMemo] = useState("");
  const [inputRating, setInputRating] = useState(5);

  const navigate = useNavigate();

  // --- 1. 로그인 체크 (페이지 진입 시) ---
  useEffect(() => {
    const storedId = localStorage.getItem("loginId");

    if (!storedId) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login"); // 로그인 페이지로 리다이렉트
    } else {
      setCurrentUserId(storedId);
    }
  }, [navigate]);

  // --- 2. 전체 강의 목록 불러오기 (Catalog) ---
  const fetchCourses = useCallback(async () => {
    try {
      const response = await axios.get(CATALOG_API_URL);
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (error) {
      console.error("강의 목록 로딩 실패:", error);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // --- 3. 검색 및 필터링 ---
  useEffect(() => {
    let result = courses;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (course) =>
          (course.courseName && course.courseName.toLowerCase().includes(lowerTerm)) ||
          (course.professor && course.professor.toLowerCase().includes(lowerTerm))
      );
    }

    if (filterOption !== "all") {
      const credit = parseInt(filterOption);
      result = result.filter((c) => c.credit === credit);
    }

    setFilteredCourses(result);
    setCurrentPage(1);
  }, [searchTerm, filterOption, courses]);

  // --- 4. 페이지네이션 ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // --- 5. 모달 열기 ---
  const openAddModal = (course) => {
    setSelectedCourse(course);
    setInputMemo("");
    setInputRating(5);
    setShowModal(true);
  };

  // --- 🕒 시간표 파싱 및 중복 확인 헬퍼 함수 ---
  const parseTimeSlots = (timeSlots) => {
    if (!timeSlots) return [];
    // 예: "Mon1, Wed2" -> ["Mon-1", "Wed-2"] 형태로 변환
    const slots = [];
    timeSlots.split(",").forEach((slot) => {
      const match = slot.trim().match(/([A-Za-z]+)(\d+)/);
      if (match) {
        slots.push(`${match[1]}-${match[2]}`);
      }
    });
    return slots;
  };

  const checkTimeConflict = (targetCourse, existingList) => {
    if (!targetCourse.timeSlots) return false;

    const targetSlots = parseTimeSlots(targetCourse.timeSlots);

    for (const existing of existingList) {
      const existingSlots = parseTimeSlots(existing.timeSlots);
      // 교집합(겹치는 시간)이 있는지 확인
      const hasOverlap = targetSlots.some(slot => existingSlots.includes(slot));
      if (hasOverlap) return true; // 겹침 발생
    }
    return false; // 겹침 없음
  };

  // --- ✨ 공통: 저장할 강의 객체 생성 함수 ---
  const createCourseObject = () => {
    return {
      uniqueId: Date.now().toString(),
      originalId: selectedCourse.id,

      professor: selectedCourse.professor,
      courseName: selectedCourse.courseName,
      classNumber: selectedCourse.classNumber,
      timeSlots: selectedCourse.timeSlots,
      classRoom: selectedCourse.classRoom,
      credit: selectedCourse.credit,
      gradeType: selectedCourse.gradeType,
      pfOption: selectedCourse.pfOption,

      memo: inputMemo,
      rating: Number(inputRating),
    };
  };

  // --- 6-A. 수강 신청 로직 (시간 겹치면 장바구니로) ---
  const handleRegister = async () => {
    if (!selectedCourse || !currentUserId) return;

    try {
      const userResponse = await axios.get(`${STUDENT_API_URL}/${currentUserId}`);
      const userData = userResponse.data;

      const currentRegistered = userData.registeredCourses || [];
      const currentCart = userData.shoppingCart || [];

      // 중복 체크 (수강 목록)
      if (currentRegistered.some(item => item.originalId === selectedCourse.id)) {
        alert("이미 수강 신청된 강의입니다.");
        setShowModal(false);
        return;
      }

      const newCourseData = createCourseObject();
      const isTimeConflict = checkTimeConflict(selectedCourse, currentRegistered);

      if (isTimeConflict) {
        // 🚨 시간 중복 -> 장바구니로 자동 이동
        if (currentCart.some(item => item.originalId === selectedCourse.id)) {
          alert("시간표가 겹쳐 장바구니에 담으려 했으나, 이미 장바구니에 존재하는 강의입니다.");
          setShowModal(false);
          return;
        }

        await axios.put(`${STUDENT_API_URL}/${currentUserId}`, {
          ...userData,
          shoppingCart: [...currentCart, newCourseData]
        });
        alert(`[${selectedCourse.courseName}] 강의 시간이 기존 시간표와 겹쳐서 장바구니에 담겼습니다.`);

      } else {
        // ✅ 정상 신청
        await axios.put(`${STUDENT_API_URL}/${currentUserId}`, {
          ...userData,
          registeredCourses: [...currentRegistered, newCourseData]
        });
        alert(`[${selectedCourse.courseName}] 수강 신청 완료!`);
      }
      setShowModal(false);

    } catch (error) {
      console.error("수강 신청 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  // --- 6-B. 장바구니 담기 로직 (직접 담기) ---
  const handleDirectToCart = async () => {
    if (!selectedCourse || !currentUserId) return;

    try {
      const userResponse = await axios.get(`${STUDENT_API_URL}/${currentUserId}`);
      const userData = userResponse.data;

      const currentRegistered = userData.registeredCourses || [];
      const currentCart = userData.shoppingCart || [];

      // 중복 체크 1: 이미 수강 신청된 강의인지
      if (currentRegistered.some(item => item.originalId === selectedCourse.id)) {
        alert("이미 수강 신청된 강의입니다.");
        return;
      }

      // 중복 체크 2: 이미 장바구니에 있는지
      if (currentCart.some(item => item.originalId === selectedCourse.id)) {
        alert("이미 장바구니에 담겨 있습니다.");
        return;
      }

      // 장바구니에 추가
      const newCourseData = createCourseObject();

      await axios.put(`${STUDENT_API_URL}/${currentUserId}`, {
        ...userData,
        shoppingCart: [...currentCart, newCourseData]
      });

      alert(`[${selectedCourse.courseName}] 장바구니에 담았습니다!`);
      setShowModal(false);

    } catch (error) {
      console.error("장바구니 담기 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 fw-bold">
        🎓 전체 강의 조회
        <div className="d-flex justify-content-end">
          <Link to="/my-courses" className="btn btn-outline-primary">내 강의목록</Link>
        </div>
      </h2>

      {/* 검색창 */}
      <div className="row mb-3 g-2">
        <div className="col-md-8">
          <input type="text" className="form-control" placeholder="강의명/교수명 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="col-md-4">
          <select className="form-select" value={filterOption} onChange={(e) => setFilterOption(e.target.value)}>
            <option value="all">전체 학점</option>
            <option value="3">3학점</option>
            <option value="2">2학점</option>
            <option value="1">1학점</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-hover align-middle mb-0 bg-white">
          <thead className="table-light">
            <tr className="text-center">
              <th>분반</th>
              <th>과목명</th>
              <th>교수</th>
              <th>학점</th>
              <th>시간/장소</th>
              <th>신청</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((course) => (
                <tr key={course.id}>
                  <td className="text-center">{course.classNumber}</td>
                  <td className="fw-bold text-primary">{course.courseName}</td>
                  <td className="text-center">{course.professor}</td>
                  <td className="text-center">{course.credit}</td>
                  <td style={{ fontSize: "0.85rem" }}>{course.timeSlots} <br /> <span className="text-muted">({course.classRoom})</span></td>
                  <td className="text-center">
                    <button className="btn btn-primary btn-sm" onClick={() => openAddModal(course)}>담기</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="text-center py-5">검색 결과 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <nav className="d-flex justify-content-center mt-4">
        <ul className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <li key={number} className={`page-item ${currentPage === number ? "active" : ""}`}>
              <button className="page-link" onClick={() => handlePageChange(number)}>{number}</button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 모달 */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">강의 담기</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>{selectedCourse?.courseName}</strong> ({selectedCourse?.professor})</p>
                <div className="mb-3">
                  <label>메모</label>
                  <textarea className="form-control" rows="2" value={inputMemo} onChange={(e) => setInputMemo(e.target.value)}></textarea>
                </div>
                <div className="mb-3">
                  <label>평점 (1~5)</label>
                  <input type="number" className="form-control" min="1" max="5" value={inputRating} onChange={(e) => setInputRating(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                {/* ✨ 버튼 분리: 장바구니 담기 / 신청하기 */}
                <button className="btn btn-warning text-white" onClick={handleDirectToCart}>
                  🛒 장바구니 담기
                </button>
                <button className="btn btn-primary" onClick={handleRegister}>
                  ✅ 수강 신청
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}