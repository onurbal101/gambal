import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Form, Button, Col, Row } from "react-bootstrap";
import FormContainer from "../components/FormContainer";
import Evaluator from "../new_iowa/src/classes/Evaluator";

const TextBox = ({
  controlId,
  label,
  placeholder,
  value,
  changeHandler,
}: any) => {
  return (
    <Form.Group controlId={controlId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => changeHandler(e.target.value)}
      ></Form.Control>
    </Form.Group>
  );
};

export default TextBox;
