import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Container, Nav, Button } from "react-bootstrap";

const NavigationBar = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("loginId"); // 로그인 여부 확인

  const handleLogout = () => {
    localStorage.removeItem("loginId");
    localStorage.removeItem("loginName");
    alert("로그아웃 되었습니다.");
    navigate("/"); // 로그인 화면으로 이동
  };

  // 로그인 페이지('/')에서는 메뉴바를 안 보여주고 싶다면 아래 코드 사용
  // if (window.location.pathname === '/') return null; 

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-3">
      <Container>
        <Navbar.Brand as={Link} to="/home">🎓 수강신청 도우미</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/home">홈</Nav.Link>
            <Nav.Link as={Link} to="/list">전체 강의</Nav.Link>
            <Nav.Link as={Link} to="/my-courses">내 강의실</Nav.Link>
          </Nav>
          <Nav>
            {isLoggedIn ? (
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            ) : (
              <Link to="/">
                <Button variant="primary" size="sm">로그인</Button>
              </Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;