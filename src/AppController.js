import React from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import AppZoomSample from "./AppZoomSample";
import App from "./App";
import AppCombinedChartSample from "./AppCombinedChartSample";
import { Badge, Col, Toast } from "react-bootstrap";

class AppController extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displaySample: null,
      showToast: false,
      toastText: null,
    };

    this.handleSampleDisplay = this.handleSampleDisplay.bind(this);
    this.showToastSuggestion = this.showToastSuggestion.bind(this);
    this.getToast = this.getToast.bind(this);
  }

  handleSampleDisplay(selectedSampleIndex) {
    let sampleToDisplay;
    let toastText;

    switch (selectedSampleIndex) {
      case 0:
        sampleToDisplay = <App />;
        toastText =
          "This Sample has a ruler and click and drag to select and resize a section using D3 js Brush and was the first implementation";
        break;
      case 1:
        sampleToDisplay = <AppZoomSample />;
        toastText =
          "This Sample has a ruler and click and drag to select and resize a section using D3 js Brush but with some UI and modifications and a new scale for the leads";
        break;
      case 2:
        sampleToDisplay = <AppCombinedChartSample />;
        toastText =
          "This Sample is a stripped down version of the previous implementations and has a click and drag to select and resize a section using D3 js Brush and also features a combo graph that has all the ECG leads";
        break;
    }

    this.setState({
      displaySample: sampleToDisplay,
      toastText: toastText,
      showToast: true,
    });
  }

  showToastSuggestion() {
    this.setState({
      showToast: false,
    });
  }

  getToast() {
    return (
      <Col md={6} className="toast-cntr mb-2">
        <Toast show={this.state.showToast} onClose={this.showToastSuggestion}>
          <Toast.Header>
            <strong className="me-auto">Help</strong>
          </Toast.Header>
          <Toast.Body>{this.state.toastText}</Toast.Body>
        </Toast>
      </Col>
    );
  }

  render() {
    return (
      <>
        <div id={"button-container"}>
          <h3 id={"button-container-label"}>
            <Badge bg="secondary">Select a Sample to view:</Badge>
          </h3>
          <ButtonGroup>
            <Button
              className={"sample-button"}
              onClick={() => this.handleSampleDisplay(0)}
            >
              First Sample
            </Button>
            <Button
              className={"sample-button"}
              onClick={() => this.handleSampleDisplay(1)}
            >
              Expanding Version
            </Button>
            <Button
              className={"sample-button"}
              onClick={() => this.handleSampleDisplay(2)}
            >
              Skeleton and Combo Version
            </Button>
          </ButtonGroup>
          {this.getToast()}
        </div>

        {this.state.displaySample}
      </>
    );
  }
}
export default AppController;
