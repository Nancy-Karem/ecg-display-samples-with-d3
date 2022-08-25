import React from "react";
import * as d3 from "d3";
import * as d3Select from "d3-selection";
import { scaleLinear } from "d3-scale";
import museData from "./GraphData/MUSE_1.csv";
import "./AppZoomSample.css";

class AppZoomSample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      chartAreas: [],
      yAxisPositions: [],
      combinedDataArray: [],
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
    this.timer = null;
    this.edgeSize = 200;
    this.setChartData = this.setChartData.bind(this);
    this.setupChartConfig = this.setupChartConfig.bind(this);
    this.createEcgLinePath = this.createEcgLinePath.bind(this);
    this.generateECGGraph = this.generateECGGraph.bind(this);
    this.generateChartAreas = this.generateChartAreas.bind(this);
    this.generateRuler = this.generateRuler.bind(this);
    this.rulerPointerEvent = this.rulerPointerEvent.bind(this);
    this.generateBrushSelection = this.generateBrushSelection.bind(this);
    this.brushedSelectionHandler = this.brushedSelectionHandler.bind(this);
    this.handleAutoScroll = this.handleAutoScroll.bind(this);
    this.checkForWindowScroll = this.checkForWindowScroll.bind(this);
  }
  componentDidMount() {
    if (!this.state.data) {
      this.setChartData();
    }
    window.addEventListener("mousemove", this.handleAutoScroll, false);
  }

  setupChartConfig(axisID) {
    this.yValue = (row) => eval(`row.${axisID}`);
    this.xValue = (row, index) => index;

    this.xScale = scaleLinear()
      .domain([0, 5000])
      .range([0, this.width * 10 + 50]);
    this.yScale = scaleLinear()
      .domain(d3.extent(this.state.data, this.yValue))
      .range([this.height / 2, -this.height / 2]);

    this.createYAxis(axisID);
    this.createXAxis(axisID);
    this.createEcgLinePath(axisID);
  }

  createXAxis(axisID) {
    const xAxis = d3.axisBottom().scale(this.xScale);
    d3Select
      .select(`#xaxis-group-${axisID}`)
      .call(xAxis)
      .attr("stroke", "#fff")
      .attr("stroke-width", "1");
    d3Select
      .select(`#xaxis-group-${axisID}`)
      .select(".domain")
      .attr("stroke", "#fff")
      .attr("stroke-width", "1");
  }

  createYAxis(axisID) {
    const yAxis = d3.axisLeft().scale(this.yScale);
    d3Select
      .select(`#yaxis-group-${axisID}`)
      .call(yAxis)
      .attr("stroke", "#fff")
      .attr("stroke-width", "1");
    d3Select
      .select(`#yaxis-group-${axisID}`)
      .select(".domain")
      .attr("stroke", "#fff")
      .attr("stroke-width", "1");
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

    let yAxisPositions = [];

    this.state.data.columns.map((d, i) => {
      yAxisPositions.push(
        <g transform={`translate(50,${i * 50 + 10})`} key={`${d}`}>
          <g
            id={`yaxis-group-${d}`}
            transform={`translate(0,${
              (this.height / 2) * (i + 1) + (this.height / 2) * i
            })`}
          ></g>
        </g>
      );

      chartAreas.push(
        <g transform={`translate(50,${i * 50 + 10})`} key={`${d}`}>
          <g
            id={`xaxis-group-${d}`}
            transform={`translate(0,${this.height * (i + 1)})`}
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

    // if (!this.rule) {
    //   this.generateRuler();
    // }

    this.setState(
      {
        chartAreas: chartAreas,
        yAxisPositions: yAxisPositions,
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
        [this.width * 10 + 100, this.height * 12 + 700],
      ])
      .on("start brush end", this.brushedSelectionHandler);

    this.brushSelector = brush;
    d3Select.select("#ecg-chart").append("g").call(this.brushSelector);
  }

  brushedSelectionHandler(event) {
    if (event.type == "brush" && event.sourceEvent) {
      this.handleAutoScroll({
        clientX: event.sourceEvent.clientX,
        clientY: event.sourceEvent.clientY,
      });
    }
  }

  handleAutoScroll(event) {
    let viewportX = event.clientX;
    let viewportY = event.clientY;

    let viewportWidth = document.documentElement.clientWidth;
    let viewportHeight = document.documentElement.clientHeight;

    let edgeSize = this.edgeSize;

    let edgeTop = 0;
    let edgeLeft = edgeSize;
    let edgeBottom = viewportHeight;
    let edgeRight = viewportWidth - edgeSize;

    let isInLeftEdge = viewportX < edgeLeft;
    let isInRightEdge = viewportX > edgeRight;
    let isInTopEdge = viewportY < edgeTop;
    let isInBottomEdge = viewportY > edgeBottom;

    if (!(isInLeftEdge || isInRightEdge || isInTopEdge || isInBottomEdge)) {
      if (this.timer) {
        clearTimeout(this.timer);
      }

      return;
    }

    let documentWidth = Math.max(
      document.body.scrollWidth,
      document.body.offsetWidth,
      document.body.clientWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    );
    let documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.body.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );

    let maxScrollX = documentWidth;
    let maxScrollY = documentHeight - viewportHeight;

    const adjustWindowScroll = () => {
      let chartScrollContext = document.getElementById("chart-axis-cntr");
      let currentScrollX = chartScrollContext.scrollLeft;
      let currentScrollY = window.scrollY;

      let canScrollLeft = currentScrollX > 0;
      let canScrollRight = currentScrollX < maxScrollX;
      let canScrollUp = currentScrollY > 0;
      let canScrollDown = currentScrollY < maxScrollY;

      let nextScrollX = currentScrollX;
      let nextScrollY = currentScrollY;

      let maxStep = 50;

      // Should we scroll left?
      if (isInLeftEdge && canScrollLeft) {
        let intensity = (edgeLeft - viewportX) / this.edgeSize;

        nextScrollX = nextScrollX - maxStep * intensity;

        // Should we scroll right?
      } else if (isInRightEdge && canScrollRight) {
        let intensity = (viewportX - edgeRight) / this.edgeSize;

        nextScrollX = nextScrollX + maxStep * intensity;
      }

      // Should we scroll up?
      if (isInTopEdge && canScrollUp) {
        let intensity = (edgeTop - viewportY) / this.edgeSize;

        nextScrollY = nextScrollY - maxStep * intensity;

        // Should we scroll down?
      } else if (isInBottomEdge && canScrollDown) {
        let intensity = (viewportY - edgeBottom) / this.edgeSize;

        nextScrollY = nextScrollY + maxStep * intensity;
      }

      nextScrollX = Math.max(0, Math.min(maxScrollX, nextScrollX));
      nextScrollY = Math.max(0, Math.min(maxScrollY, nextScrollY));

      if (nextScrollX !== currentScrollX || nextScrollY !== currentScrollY) {
        if (isInLeftEdge) {
          chartScrollContext.scrollLeft -= 12;
        }
        if (isInRightEdge) {
          chartScrollContext.scrollLeft += 12;
        } else {
          window.scrollTo(nextScrollX, nextScrollY);
        }

        return true;
      } else {
        return false;
      }
    };

    this.timer = this.checkForWindowScroll(adjustWindowScroll());
  }

  checkForWindowScroll(setTimeoutValue) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    if (setTimeoutValue) {
      return setTimeout(this.checkForWindowScroll, 30);
    }
  }

  render() {
    return (
      <>
        <div id={"chart-window"}>
          <svg
            id={"ecg-chart-axis"}
            width={this.width + 150}
            height={this.height * 12 + 700}
            transform={"translate(50,0)"}
          >
            {this.state.yAxisPositions}
          </svg>
          <div id={"chart-axis-cntr"}>
            <svg
              id={"ecg-chart"}
              width={this.width * 10 + 150}
              height={this.height * 12 + 700}
              transform={"translate(50,0)"}
            >
              {this.state.chartAreas}
            </svg>
          </div>
        </div>
      </>
    );
  }
}
export default AppZoomSample;
