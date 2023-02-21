import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Form, Button, Col, Row } from "react-bootstrap";
import FormContainer from "../components/FormContainer";
import Evaluator from "../new_iowa/src/classes/Evaluator";

const EvaluatorScreen = ({ evaluator }: any) => {
  const [name, setName] = useState(evaluator.name || "");
  const [title, setTitle] = useState(evaluator.title || "");
  const [profession, setProfession] = useState(evaluator.profession || "");
  const [organisation, setOrganisation] = useState(
    evaluator.organisation || ""
  );

  const handler = (prop: any, setter: any) => (value: any) => {
    evaluator[prop] = value;
    setter(value);
  };

  const nameHandler = handler("name", setName);
  const titleHandler = handler("title", setTitle);
  const professionHandler = handler("profession", setProfession);
  const organisationHandler = handler("organisation", setOrganisation);

  const submitHandler = (event: any) => {
    event.preventDefault();
  };

  return (
    <FormContainer>
      <h1>Evaluator</h1>

      <Form onSubmit={submitHandler}>
        <Form.Group controlId="name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter full name"
            value={name}
            onChange={(e) => nameHandler(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="title">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter title of the evaluator"
            value={title}
            onChange={(e) => titleHandler(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="profession">
          <Form.Label>Profession</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter profession"
            value={profession}
            onChange={(e) => professionHandler(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="organisation">
          <Form.Label>Organisation</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter organisation"
            value={organisation}
            onChange={(e) => organisationHandler(e.target.value)}
          ></Form.Control>
        </Form.Group>
      </Form>
    </FormContainer>
  );
};

export default EvaluatorScreen;
