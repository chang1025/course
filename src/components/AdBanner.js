// src/components/AdBanner.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Button, Spinner } from "react-bootstrap";

const AdBanner = () => {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      // 캐시 방지를 위해 timestamp 추가
      const response = await axios.get(`https://api.adviceslip.com/advice?t=${Date.now()}`);
      setAdvice(response.data.slip.advice);
    } catch (error) {
      console.error("API Error:", error);
      setAdvice("No advice available today.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <div className="mt-5 mb-4">
      <Card className="text-center border-success shadow-sm">
        <Card.Header className="bg-success text-white fw-bold">
          🌿 오늘의 힐링 한마디
        </Card.Header>
        <Card.Body>
          <Card.Title>수강신청으로 지친 당신에게</Card.Title>
          <Card.Text className="fst-italic my-3 fs-5">
            {loading ? <Spinner animation="border" variant="success" size="sm" /> : `"${advice}"`}
          </Card.Text>
          <Button variant="outline-success" size="sm" onClick={fetchAdvice}>
            다른 조언 보기 🔄
          </Button>
        </Card.Body>
        <Card.Footer className="text-muted small">
          Sponsored by Advice Slip API
        </Card.Footer>
      </Card>
    </div>
  );
};

export default AdBanner;