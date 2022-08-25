import React from "react";
import * as d3 from "d3";
import * as d3Select from "d3-selection";
import { scaleLinear } from "d3-scale";
import museData from "./GraphData/MUSE_1.csv";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      chartAreas: [],
    };
    this.height = 250;
    this.width = 900;
    this.myRef = React.createRef();
    this.margin = {
      top: 50,
      left: 50,
    };
    this.xScale = null;
    this.yScale = null;
    this.yValue = null;
    this.xValue = null;
    this.rule = null;
    this.brushSelector = null;
    this.setChartData = this.setChartData.bind(this);
    this.setupChartConfig = this.setupChartConfig.bind(this);
    this.createEcgLinePath = this.createEcgLinePath.bind(this);
    this.generateECGGraph = this.generateECGGraph.bind(this);
    this.generateChartAreas = this.generateChartAreas.bind(this);
    this.generateRuler = this.generateRuler.bind(this);
    this.rulerPointerEvent = this.rulerPointerEvent.bind(this);
    this.generateBrushSelection = this.generateBrushSelection.bind(this);
    this.brushedSelectionHandler = this.brushedSelectionHandler.bind(this);
  }
  componentDidMount() {
    if (!this.state.data) {
      this.setChartData();
    }
  }

  setupChartConfig(axisID) {
    this.yValue = (row) => eval(`row.${axisID}`);
    this.xValue = (row, index) => index;

    this.xScale = scaleLinear()
      .domain([0, 5000])
      .range([0, this.width + 50]);
    this.yScale = scaleLinear()
      .domain(d3.extent(this.state.data, this.yValue))
      .range([this.height / 2, -this.height / 2]);

    this.createYAxis(axisID);
    this.createXAxis(axisID);
    this.createEcgLinePath(axisID);
  }

  createXAxis(axisID) {
    const xAxis = d3.axisBottom().scale(this.xScale);
    d3Select.select(`#xaxis-group-${axisID}`).call(xAxis);
  }

  createYAxis(axisID) {
    const yAxis = d3.axisLeft().scale(this.yScale);
    d3Select.select(`#yaxis-group-${axisID}`).call(yAxis);
  }

  createEcgLinePath(axisID) {
    const ecgLine = d3
      .line()
      .x((d, i) => this.xScale(this.xValue(d, i)))
      .y((d) => this.yScale(this.yValue(d)))(this.state.data);

    d3Select.select(`#ecg-line-path-${axisID}`).attr("d", ecgLine);
  }

  setChartData() {
    const rowParser = (row) => {
      row.I = +row.I;
      row.II = +row.II;
      row.III = +row.III;
      row.aVR = +row.aVR;
      row.aVL = +row.aVL;
      row.aVF = +row.aVF;
      row.V1 = +row.V1;
      row.V2 = +row.V2;
      row.V3 = +row.V3;
      row.V4 = +row.V4;
      row.V5 = +row.V5;
      row.V6 = +row.V6;

      return row;
    };

    d3.csv(museData, rowParser).then((data) => {
      this.setState(
        {
          data: data,
        },
        this.generateECGGraph
      );
    });
  }

  generateECGGraph() {
    let chartAreas = [];

    this.state.data.columns.map((d, i) => {
      chartAreas.push(
        <g transform={`translate(50,${i * 50 + 10})`} key={`${d}`}>
          <g
            id={`xaxis-group-${d}`}
            transform={`translate(0,${this.height * (i + 1)})`}
          ></g>
          <g
            id={`yaxis-group-${d}`}
            transform={`translate(0,${
              (this.height / 2) * (i + 1) + (this.height / 2) * i
            })`}
          ></g>
          <g>
            <path
              id={`ecg-line-path-${d}`}
              transform={`translate(0,${
                (this.height / 2) * (i + 1) + (this.height / 2) * i
              })`}
              fill={"none"}
              stroke={"blue"}
            ></path>
          </g>
        </g>
      );
    });

    if (!this.rule) {
      this.generateRuler();
    }

    this.setState(
      {
        chartAreas: chartAreas,
      },
      this.generateChartAreas
    );
  }

  generateChartAreas() {
    if (!this.xScale) {
      this.state.data.columns.map((d) => {
        this.setupChartConfig(d);
      });

      if (!this.brushSelector) {
        this.generateBrushSelection();
      }
    }
  }

  generateRuler() {
    const rule = d3Select.select(`#ecg-chart`).append("g");

    rule
      .append("line")
      .attr("y1", 0)
      .attr("y2", this.height * 12 + 700)
      .attr("stroke", "currentColor");

    d3Select
      .select(`#ecg-chart`)
      .on("pointermove", (event) => this.rulerPointerEvent(event));

    this.rule = rule;
  }

  updateRuler(xValue) {
    let xValueSet = d3.range(5000);
    xValue = d3.bisectCenter(xValueSet, xValue);
    let transformValue = this.xScale(xValue);
    transformValue = transformValue < 50 ? 50 : transformValue;

    this.rule.attr("transform", `translate(${transformValue},0)`);
  }

  rulerPointerEvent(event) {
    this.updateRuler(this.xScale.invert(d3.pointer(event)[0]));
  }

  generateBrushSelection() {
    const brush = d3
      .brushX()
      .extent([
        [this.margin.left, 0],
        [this.width + 100, this.height * 12 + 700],
      ])
      .on("start brush end", this.brushedSelectionHandler);

    this.brushSelector = brush;
    d3Select
      .select("#ecg-chart")
      .append("g")
      .call(this.brushSelector)
      .call(this.brushSelector.move, [0.3, 0.5].map(this.xScale));
  }

  brushedSelectionHandler() {}

  render() {
    return (
      <>
        <div ref={this.myRef}></div>
        <svg
          id={"ecg-chart"}
          width={this.width + 150}
          height={this.height * 12 + 700}
          transform={"translate(50,0)"}
        >
          {this.state.chartAreas}
        </svg>
      </>
    );
  }
}
export default App;
