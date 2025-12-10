import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Spinner, Badge } from "react-bootstrap";
import AdBanner from "../components/AdBanner";

const STUDENT_API_URL = "https://692ce8fae5f67cd80a4979ed.mockapi.io/student";
const CATALOG_API_URL = "https://692ce8f1e5f67cd80a4979c8.mockapi.io/course";

export default function Home() {
  const [userData, setUserData] = useState(null);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ 공지사항 데이터 (보내주신 링크 활용)
  const notices = [
    {
      title: "📅 2025-1학기 수강신청 안내",
      url: "https://hisnet.handong.edu/myboard/list.php?Board=NB0001"
    },
    {
      title: "🎓 졸업 사정 자가진단 오픈",
      url: "https://hisnet.handong.edu/myboard/list.php?Board=NB0001"
    },
    {
      title: "💰 장학금 신청 기간",
      url: "https://hisnet.handong.edu/myboard/list.php?Board=JANG_NOTICE"
    }
  ];

  useEffect(() => {
    const storedId = localStorage.getItem("loginId");
    if (!storedId) {
      alert("로그인이 필요합니다.");
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const userRes = await axios.get(`${STUDENT_API_URL}/${storedId}`);
        setUserData(userRes.data);

        const catalogRes = await axios.get(CATALOG_API_URL);
        const allCourses = catalogRes.data;

        if (allCourses.length > 0) {
          const shuffled = [...allCourses].sort(() => 0.5 - Math.random());
          setRecommendedCourses(shuffled.slice(0, 3));
        }

        setLoading(false);
      } catch (err) {
        console.error("데이터 로딩 실패:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  const myCourses = userData?.registeredCourses || [];
  const courseCount = myCourses.length;
  const totalCredits = myCourses.reduce((sum, c) => sum + (c.credit || 0), 0);
  const lastCourse = myCourses.length > 0 ? myCourses[myCourses.length - 1] : null;

  return (
    <Container className="mt-4">
      {/* 1. 환영 섹션 */}
      <div className="p-5 mb-4 bg-light rounded-3 shadow-sm text-center text-md-start">
        <h1 className="display-5 fw-bold">반가워요, {userData?.userName || "학생"}님! 👋</h1>
        <p className="fs-4 text-muted">오늘도 알찬 대학 생활 되세요.</p>
        <div className="d-flex gap-2 justify-content-center justify-content-md-start mt-4">
          <Link to="/list">
            <Button variant="primary" size="lg">🔍 강의 찾기</Button>
          </Link>
          <Link to="/my-courses">
            <Button variant="outline-dark" size="lg">📅 내 시간표</Button>
          </Link>
        </div>
      </div>

      {/* ✅ 2. [New] 학사 공지사항 섹션 (이미지 참고하여 추가) */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white fw-bold py-3">
          📢 학사 공지사항 (Notice)
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            {notices.map((notice, index) => (
              <Col md={4} key={index}>
                <Button
                  variant="outline-secondary"
                  className="w-100 py-3 text-dark fw-semibold"
                  href={notice.url}
                  target="_blank" // 새 탭에서 열기
                  rel="noopener noreferrer" // 보안 옵션
                  style={{ borderStyle: 'dashed' }} // 점선 테두리로 강조
                >
                  {notice.title}
                </Button>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* 3. 대시보드 (현황) */}
        <Col lg={4} md={6}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <Card.Title className="fw-bold mb-4">📊 수강 신청 현황</Card.Title>
              <div className="d-flex justify-content-around text-center align-items-center">
                <div>
                  <h3 className="text-primary fw-bold display-6">{courseCount}</h3>
                  <span className="text-muted">과목 수</span>
                </div>
                <div className="vr"></div>
                <div>
                  <h3 className="text-success fw-bold display-6">{totalCredits}</h3>
                  <span className="text-muted">총 학점</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* 4. 최근 담은 강의 */}
        <Col lg={4} md={6}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <Card.Title className="fw-bold mb-3">🕒 최근 담은 강의</Card.Title>
              {lastCourse ? (
                <div className="p-3 bg-light rounded border">
                  <Badge bg="info" className="mb-2 text-dark">{lastCourse.classNumber}분반</Badge>
                  <h5 className="fw-bold text-primary text-truncate">{lastCourse.courseName}</h5>
                  <p className="text-muted mb-1 small">{lastCourse.professor} | {lastCourse.credit}학점</p>
                  <p className="text-muted small mb-0">At: {lastCourse.classRoom}</p>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  아직 신청한 강의가 없습니다.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* 5. 추천 강의 */}
        <Col lg={4} md={12}>
          <Card className="h-100 shadow-sm border-0 bg-primary-subtle">
            <Card.Body>
              <Card.Title className="fw-bold mb-3">🔥 추천 교양/전공</Card.Title>
              <div className="d-flex flex-column gap-2">
                {recommendedCourses.map((course) => (
                  <div key={course.id} className="p-2 bg-white rounded shadow-sm d-flex justify-content-between align-items-center">
                    <div style={{ overflow: "hidden" }}>
                      <div className="fw-bold text-truncate" style={{ maxWidth: "150px" }}>
                        {course.courseName}
                      </div>
                      <small className="text-muted">{course.professor}</small>
                    </div>
                    <Badge bg="secondary">{course.credit}학점</Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 6. 하단 광고 배너 */}
      <AdBanner />
    </Container>
  );
}