// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import NavigationBar from './components/Navbar';

// 컴포넌트 임포트 (경로는 실제 파일 위치에 맞게 수정하세요)
import CourseList from './pages/CourseList';
import CourseEdit from './pages/CourseEdit';
import Login from './pages/Login';
import CourseAdd from './pages/CourseAdd';
import Home from './pages/Home';

function App() {
  return (
    // 🚨 핵심: 모든 라우트 컴포넌트는 <Router>로 감싸져 있어야 합니다.
    <Router>
      <NavigationBar />
      <Routes>
        {/* CourseList를 메인 페이지('/')로 설정하거나 원하는 경로에 설정 */}
        <Route path="/list" element={<CourseList />} />
        <Route path="/my-courses" element={<CourseEdit />} />
        <Route path="/" element={<Login />} />
        <Route path="/add" element={<CourseAdd />} />
        <Route path="/home" element={<Home />} />
        {/* 필요한 경우 다른 라우트 추가 */}
        {/* <Route path="/my-courses" element={<MyCourses />} /> */}
      </Routes>
    </Router>
  );
}

export default App;