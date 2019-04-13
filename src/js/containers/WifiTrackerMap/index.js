import React, { Component } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { forEach } from 'lodash';
import { filter } from 'lodash';
import { Map, InfoWindow, Marker, GoogleApiWrapper, Polyline } from 'google-maps-react';
import { Bbox} from '@turf/bbox';
import { bboxPolygon} from '@turf/bbox-polygon';
import collect from '@turf/circle';
import { point} from '@turf/helpers';
import distance from '@turf/distance';
import * as d3 from "d3";
import './style.scss';
import { RadialGauge } from "react-canvas-gauges";
import './sidebar/index.js';
import { FaHome, FaMap, FaUsers, FaBars } from 'react-icons/fa';
import { GoArrowUp, GoArrowDown } from 'react-icons/go';
import { WiHumidity, WiStrongWind } from 'react-icons/wi';
import { Container, Row, Col} from 'react-bootstrap';
import $ from 'jquery';
import moment from 'moment';


class WifiTrackerMap extends Component {

  state = {
    x:0,
    y:0,
    init:false,
    google_print_points: [],
    gps_print_points: [],
    gauages_size: 100,
    cars:[],
    today_data:[],
    stacked_chart_data: [[0,0,0,0],[0,0,0,0],[0,0,0,0]],
    routes_distance : {d_11s1:[], d_11s2:[], d_11Ms1:[], d_11Ms2:[]},
    weather:{temp:null,max_temp:null,min_temp:null,humidity:null,wind:null}
  }

  componentDidMount() {
    this.drawChart();
    this.interval = setInterval(() => this.drawChart(), 10000);
    window.removeEventListener('resize', this.drawChart())
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.drawChart())
  }

  _onMouseMove(e) {
    this.setState({ x: e.pageX, y: e.pageY });
  }

  drawChart = async() => {
    this.settingWindowSize();
    await this.getAllIntervals();
    await this.getAllMinibuses();
    await this.getAllJourneies();
    await this.getWeather();
    await this.drawStackChart();
    this.drawLineChart();
  }

  settingWindowSize(){
    var w = window.innerWidth
    var h = window.innerHeight
    this.setState({
      gauages_size: h*0.15
    })
  }

  getAllIntervals = async () => {
    var {init} = this.state
    if(init == false)
    {
      var routes_distance = {d_11s1:[], d_11s2:[], d_11Ms1:[], d_11Ms2:[]}

      var data = await fetch(`http://staging.socif.co:3002/api/v2/data/getIntervals/?route=11&seq=1`)
      var results = await data.json();
      var response = results.response
      var route_distance = 0
      var d_11s1 = [0]
      response.forEach( (r,i) => {
        if(i==0)
          return
        var pre_location = response[i-1].location
        var location = response[i].location
        var lat1 = pre_location.lat
        var lng1 = pre_location.lng
        var lat2 = location.lat
        var lng2 = location.lng
        var pre_point = point([lat1, lat1]);
        var cur_point = point([lat2, lat2]);
        var options = {units: 'kilometers'};
        var d = distance(pre_point, cur_point, options)
        route_distance = route_distance + d
        d_11s1.push(route_distance)
      })
      routes_distance.d_11s1 = d_11s1


      var data = await fetch(`http://staging.socif.co:3002/api/v2/data/getIntervals/?route=11&seq=2`)
      var results = await data.json();
      var response = results.response
      var route_distance = 0
      var d_11s2 = [0]
      response.forEach( (r,i) => {
        if(i==0)
          return
        var pre_location = response[i-1].location
        var location = response[i].location
        var lat1 = pre_location.lat
        var lng1 = pre_location.lng
        var lat2 = location.lat
        var lng2 = location.lng
        var pre_point = point([lat1, lat1]);
        var cur_point = point([lat2, lat2]);
        var options = {units: 'kilometers'};
        var d = distance(pre_point, cur_point, options)
        route_distance = route_distance + d
        d_11s2.push(route_distance)
      })
      routes_distance.d_11s2 = d_11s2



      var data = await fetch(`http://staging.socif.co:3002/api/v2/data/getIntervals/?route=11M&seq=1`)
      var results = await data.json();
      var response = results.response
      var route_distance = 0
      var d_11Ms1 = [0]
      response.forEach( (r,i) => {
        if(i==0)
          return
        var pre_location = response[i-1].location
        var location = response[i].location
        var lat1 = pre_location.lat
        var lng1 = pre_location.lng
        var lat2 = location.lat
        var lng2 = location.lng
        var pre_point = point([lat1, lat1]);
        var cur_point = point([lat2, lat2]);
        var options = {units: 'kilometers'};
        var d = distance(pre_point, cur_point, options)
        route_distance = route_distance + d
        d_11Ms1.push(route_distance)
      })
      routes_distance.d_11Ms1 = d_11Ms1



      var data = await fetch(`http://staging.socif.co:3002/api/v2/data/getIntervals/?route=11M&seq=2`)
      var results = await data.json();
      var response = results.response
      var route_distance = 0
      var d_11Ms2 = [0]
      response.forEach( (r,i) => {
        if(i==0)
          return
        var pre_location = response[i-1].location
        var location = response[i].location
        var lat1 = pre_location.lat
        var lng1 = pre_location.lng
        var lat2 = location.lat
        var lng2 = location.lng
        var pre_point = point([lat1, lat1]);
        var cur_point = point([lat2, lat2]);
        var options = {units: 'kilometers'};
        var d = distance(pre_point, cur_point, options)
        route_distance = route_distance + d
        d_11Ms2.push(route_distance)
      })
      routes_distance.d_11Ms2 = d_11Ms2

      this.setState({
        init: true,
        routes_distance, routes_distance
      })
    }
  }

  getAllJourneies = async () => {
    var { cars } = this.state

    const data = await fetch(`http://staging.socif.co:3002/api/v2/minibus/getJourney`)
    const results = await data.json();
    var response = results.response

    var today_data = []
    var stacked_chart_data = [[0,0,0,0],[0,0,0,0],[0,0,0,0]]
    response.forEach(r => {
      var date = moment().startOf('month');
      var today = moment().startOf('day');
      if(r.startTime >= today.valueOf())
      {
        today_data.push(r)
      }

      if(r.startTime >= date.valueOf())
      {
        cars.forEach((car,i) => {
          if(r.license == car.license)
            stacked_chart_data[0][i] = stacked_chart_data[0][i] + 1
        })
      }
      else if(r.startTime >= date.subtract(1, 'months').valueOf())
      {
        cars.forEach((car,i) => {
          if(r.license == car.license)
            stacked_chart_data[1][i] = stacked_chart_data[1][i] + 1
        })
      }
      else if(r.startTime >= date.subtract(1, 'months').valueOf())
      {
        cars.forEach((car,i) => {
          if(r.license == car.license)
            stacked_chart_data[2][i] = stacked_chart_data[2][i] + 1
        })
      }
    })
    this.setState({
      stacked_chart_data: stacked_chart_data,
      today_data: today_data
    })
  }

  getAllMinibuses = async () =>{
    const data = await fetch(`http://production.socif.co:3002/api/v2/minibus/getAllMinibuses`);
    const results = await data.json();
    var response = results.response
    this.setState({
      cars: response.slice(0, 4)
    })
  }

  getWeather = async() => {
    const data = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=22.333364&lon=114.256011&APPID=12731c731786ca5fd9206b9456fa0608`);
    const results = await data.json();
    var main = results.main;
    var weather = {temp: parseInt(main.temp-273.15) ,max_temp: parseInt(main.temp_max-273.15) ,min_temp: parseInt(main.temp_min-273.15),humidity:main.humidity,wind:results.wind.speed}
    this.setState({
      weather : weather
    })
  }

  drawStackChart(){
    var {stacked_chart_data, cars} = this.state

    var date = moment()

    var third_month = date.format("MM/YYYY")
    var second_month = date.subtract(1,'month').format("MM/YYYY")
    var frist_month = date.subtract(1,'month').format("MM/YYYY")
    //date.format("MM/YYYY")
    var data = [
      {month: frist_month, m1: stacked_chart_data[2][0], m2: stacked_chart_data[2][1], m3: stacked_chart_data[2][2], m4: stacked_chart_data[2][3], minibus:cars},
      {month: second_month, m1: stacked_chart_data[1][0], m2: stacked_chart_data[1][1], m3: stacked_chart_data[1][2], m4: stacked_chart_data[1][3], minibus:cars},
      {month: third_month, m1: stacked_chart_data[0][0], m2: stacked_chart_data[0][1], m3: stacked_chart_data[0][2], m4: stacked_chart_data[0][3], minibus:cars},
    ];

    var series = d3.stack()
        .keys(["m1", "m2", "m3", "m4"])
        .offset(d3.stackOffsetDiverging)
        (data);

    document.getElementById("stacked-chart").innerHTML = ""
    var svg = d3.select("#stacked-chart"),
        margin = {top: 30, right: 30, bottom: 30, left: 60},
        width = $(window).width() * 0.25,
        height = $(window).height() * 0.25;

    var x = d3.scaleBand()
        .domain(data.map(function(d) { return d.month; }))
        .rangeRound([margin.left, width - margin.right])
        .padding(0.1);

    var y = d3.scaleLinear()
        .domain([0, 2200])
        .rangeRound([height - margin.bottom, margin.top]);

    var z = d3.scaleOrdinal(d3.schemeCategory10);

    svg.append("g")
      .selectAll("g")
      .data(series)
      .enter().append("g")
        .attr("fill", function(d) { return z(d.key); })
      .selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("width", x.bandwidth)
        .attr("x", function(d) { return x(d.data.month); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .on("mouseover", function(d) {
          var minibuses = d.data.minibus
          var {m1, m2, m3, m4} = d.data
          var ms = [m1, m2, m3, m4]

          var result = ""
          result += "Journey Number: <br>"
          minibuses.map( function(minibus,i){
            result += minibus.license + " : " + ms[i] + "<br>"
          })
          $('.tooltip').html(result);
          $('.tooltip').addClass("show_tooltip")
          $('.tooltip').removeClass("hidden_tooltip")
        })
        .on("mouseout", function(d) {
          $('.tooltip').addClass("hidden_tooltip")
          $('.tooltip').removeClass("show_tooltip")
        })

    svg.append("g")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(d3.axisLeft(y));
  }

  drawLineChart(){

    var {today_data, cars, routes_distance} = this.state

    var earlyStartTime = null

    var lastlyStartTime = null

    var temp = []
    cars.forEach((car, i) => {
      var license = car.license
      var route = car.route
      var interval = car.currentState.interval
      var running_journeyId = car.currentState.journeyId
      var temp_values = []

      var today_d = today_data.filter(d => {
        return ( d.license.valueOf() == license.valueOf() ) && ( d._id != running_journeyId)
      })

      var total_distance = 0

      // calculate pass journey
      today_d.forEach(d => {
        var startTime = d.startTime
        var seq = d.seq
        if(route == '11' && seq ==1)
          total_distance = total_distance + routes_distance.d_11s1[routes_distance.d_11s1.length-1]
        else if( route == '11' && seq ==2 )
          total_distance = total_distance + routes_distance.d_11s2[routes_distance.d_11s2.length-1]
        else if( route == '11M' && seq ==1 )
          total_distance = total_distance + routes_distance.d_11Ms1[routes_distance.d_11Ms1.length-1]
        else if( route == '11M' && seq ==2 )
          total_distance = total_distance + routes_distance.d_11Ms2[routes_distance.d_11Ms2.length-1]


        // check earlyStartTime and lastlyStartTime
        if(startTime<earlyStartTime || earlyStartTime==null)
          earlyStartTime = startTime
        if(startTime>lastlyStartTime || lastlyStartTime==null)
          lastlyStartTime = startTime

        var temp_date = moment(startTime).format('HH : mm')
        temp_values.push({date: temp_date, price: total_distance})
      })

      // calculate current journey
      if(interval != 0){
        var seq = car.currentState.seq
        if(route == '11' && seq ==1)
          total_distance = total_distance + routes_distance.d_11s1[interval]
        else if( route == '11' && seq ==2 )
          total_distance = total_distance + routes_distance.d_11s2[interval]
        else if( route == '11M' && seq ==1 )
          total_distance = total_distance + routes_distance.d_11Ms1[interval]
        else if( route == '11M' && seq ==2 )
          total_distance = total_distance + routes_distance.d_11Ms2[interval]
        var temp_date = moment().format('HH : mm')
        // check earlyStartTime and lastlyStartTime
        lastlyStartTime = moment()
        temp_values.push({date: temp_date, price: total_distance})
      }

      var temp_d = { name: license, values: temp_values }
      temp.push(temp_d)
    })

    temp = temp.filter(t => {
      return t.values.length != 0 && t.values.length != 1
    })

    // add StartTime value and LastTime value
    temp.forEach(t => {
      var values = t.values
      var firstValue = values[0]
      var lastValue = values[values.length-1]
      if(firstValue.date != moment(earlyStartTime).format('HH : mm'))
      {
        t.values.splice(0, 0, {date: moment(earlyStartTime).format('HH : mm'), price: 0});
      }

      if(lastValue.date != moment(lastlyStartTime).format('HH : mm'))
      {
        t.values.push({date: moment(lastlyStartTime).format('HH : mm'), price: t.values[t.values.length-1].price})
      }
    })

    var data = temp

    var width = $(window).width() * 0.25;
    var height = $(window).height() * 0.25;
    var margin = 30;
    var duration = 250;

    var lineOpacity = "0.25";
    var lineOpacityHover = "0.85";
    var otherLinesOpacityHover = "0.1";
    var lineStroke = "1.5px";
    var lineStrokeHover = "2.5px";

    var circleOpacity = '0.85';
    var circleOpacityOnLineHover = "0.25"
    var circleRadius = 3;
    var circleRadiusHover = 6;


    /* Format Data */
    var parseDate = d3.timeParse("%H : %M");
    data.forEach(function(d) {
      d.values.forEach(function(d) {
        d.date = parseDate(d.date);
        d.price = +d.price;
      });
    });


    var xScaleLastIndex = 0
    var xScale = d3.scaleTime()
      .domain(d3.extent(data[0].values, d => d.date))
      .range([0, width-margin]);

    console.log("max = ")
    var max = 0;
    data.map(d => {
      d3.max(d.values, d => d.price)>max?max=d3.max(data[0].values, d => d.price):null
    })
    var yScaleMaxIndex = 0
    var yScale = d3.scaleLinear()
      .domain([0, max])
      .range([height-margin, 0]);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    /* Add SVG */
    document.getElementById("chart").innerHTML = ""
    var svg = d3.select("#chart").append("svg")
      .attr("width", (width+margin)+"px")
      .attr("height", (height+margin)+"px")
      .append('g')
      .attr("transform", `translate(${margin}, ${margin})`);


    /* Add line into SVG */
    var line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.price));

    let lines = svg.append('g')
      .attr('class', 'lines');

    lines.selectAll('.line-group')
      .data(data).enter()
      .append('g')
      .attr('class', 'line-group')
      .on("mouseover", function(d, i) {
          svg.append("text")
            .attr("class", "title-text")
            .style("fill", color(i))
            .text(d.name)
            .attr("text-anchor", "middle")
            .attr("x", (width-margin)/2)
            .attr("y", 5);
        })
      .on("mouseout", function(d) {
          svg.select(".title-text").remove();
        })
      .append('path')
      .attr('class', 'line')
      .attr('d', d => line(d.values))
      .style('stroke', (d, i) => color(i))
      .style('opacity', lineOpacity)
      .on("mouseover", function(d) {
          d3.selectAll('.line')
    					.style('opacity', otherLinesOpacityHover);
          d3.selectAll('.circle')
    					.style('opacity', circleOpacityOnLineHover);
          d3.select(this)
            .style('opacity', lineOpacityHover)
            .style("stroke-width", lineStrokeHover)
            .style("cursor", "pointer");
        })
      .on("mouseout", function(d) {
          d3.selectAll(".line")
    					.style('opacity', lineOpacity);
          d3.selectAll('.circle')
    					.style('opacity', circleOpacity);
          d3.select(this)
            .style("stroke-width", lineStroke)
            .style("cursor", "none");
        });


    /* Add circles in the line */
    lines.selectAll("circle-group")
      .data(data).enter()
      .append("g")
      .style("fill", (d, i) => color(i))
      .selectAll("circle")
      .data(d => d.values).enter()
      .append("g")
      .attr("class", "circle")
      .on("mouseover", function(d) {
          d3.select(this)
            .style("cursor", "pointer")
            .append("text")
            .attr("class", "text")
            .text(`${d.price}`)
            .attr("x", d => xScale(d.date) + 5)
            .attr("y", d => yScale(d.price) - 10);
        })
      .on("mouseout", function(d) {
          d3.select(this)
            .style("cursor", "none")
            .transition()
            .duration(duration)
            .selectAll(".text").remove();
        })
      .append("circle")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.price))
      .attr("r", circleRadius)
      .style('opacity', circleOpacity)
      .on("mouseover", function(d) {
            d3.select(this)
              .transition()
              .duration(duration)
              .attr("r", circleRadiusHover);
          })
        .on("mouseout", function(d) {
            d3.select(this)
              .transition()
              .duration(duration)
              .attr("r", circleRadius);
          });


    /* Add Axis into SVG */
    var xAxis = d3.axisBottom(xScale).ticks(5);
    var yAxis = d3.axisLeft(yScale).ticks(5);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${height-margin})`)
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append('text')
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("fill", "#000")
      .text("Total distance (km)");
  }

  getWifiLocation = async(state) => {

    var ip_strings = ["E8:DE:27:22:98:CC*-64*3","14:91:82:BB:81:1D*-70*2","C0:25:E9:F9:85:B5*-92*11"]
    var google_print_points = []


    const tasks = ip_strings.map(ip =>
        fetch(`https:api.mylnikov.org/geolocation/wifi?v=1.2&bssid=`+ip.substring(0,ip.indexOf('*')))
        .then(res => res.json())
            .then(json => {
              return json
        })
    )
    //
    await Promise.all(tasks).then(res => {
      res.forEach(r => {
        var data = r.data
        var print_point = {location:{lat:data.lat,lng:data.lon},range:data.range};
        google_print_points.push(print_point)
      })
    })

    this.setState({
      google_print_points: google_print_points
    })
  }

  getGPSLocation = async(state) => {
    var raw_data = [
      "(864768011624589,DW30,090319,A,2220.00205N,11415.76958E,0.145,094754,000.0,124.30,13,0)",
      "(864768011624589,DW3B,090319,A,2220.00205N,11415.76958E,0.145,094754,000.0,124.30,13,0)",
      "(864768011624589,ZC20,090319,094752,5,388,227,1)",
      "(864768011624589,DW30,090319,A,2220.00060N,11415.76891E,0.312,094804,000.0,130.00,13,0)",
      "(864768011624589,DW30,090319,A,2219.99928N,11415.76884E,0.249,094814,000.0,135.80,12,0)",
      "(864768011624589,DW30,090319,A,2219.99737N,11415.76830E,0.112,094824,000.0,139.80,13,0)",
      "(864768011624589,DW30,090319,A,2219.99789N,11415.76808E,0.107,094834,000.0,136.40,13,0)",
      "(864768011624589,DW30,090319,A,2219.99806N,11415.76887E,0.080,094844,000.0,137.30,15,0)",
      "(864768011624589,DW30,090319,A,2219.99772N,11415.76872E,0.017,094854,000.0,141.70,15,0)",
      "(864768011624589,DW30,090319,A,2219.99728N,11415.76908E,0.093,094904,000.0,144.10,13,0)",
      "(864768011624589,DW30,090319,A,2219.99768N,11415.76840E,0.048,094914,000.0,145.10,13,0)",
      "(864768011624589,DW30,090319,A,2219.99852N,11415.76904E,0.603,094924,000.0,145.70,14,0)", "(864768011624589,DW30,090319,A,2220.00000N,11415.77102E,0.497,094934,000.0,147.10,13,0)",
      "(864768011624589,DW30,090319,A,2220.00036N,11415.77284E,0.316,094944,000.0,147.70,13,0)",
      "(864768011624589,DW30,090319,A,2220.00048N,11415.77324E,0.038,094954,000.0,148.60,13,0)",
      "(864768011624589,DW30,090319,A,2220.00057N,11415.77470E,0.677,095004,000.0,148.30,15,0)",
      "(864768011624589,DW30,090319,A,2219.99963N,11415.77535E,0.030,095014,000.0,148.00,15,0)",
      "(864768011624589,DW30,090319,A,2219.99836N,11415.77593E,0.102,095024,000.0,147.10,16,0)",
      "(864768011624589,DW30,090319,A,2219.99752N,11415.77612E,0.025,095034,000.0,146.30,15,0)",
      "(864768011624589,DW30,090319,A,2219.99727N,11415.77637E,0.076,095044,000.0,146.60,16,0)",
      "(864768011624589,DW30,090319,A,2219.99655N,11415.77640E,0.066,095054,000.0,147.00,16,0)",
      "(864768011624589,DW30,090319,A,2219.99754N,11415.77692E,0.080,095104,000.0,144.50,16,0)",
      "(864768011624589,DW30,090319,A,2219.99834N,11415.77677E,0.081,095114,000.0,142.60,16,0)",
      "(864768011624589,DW30,090319,A,2219.99868N,11415.77712E,0.052,095124,000.0,142.00,16,0)", "(864768011624589,DW30,090319,A,2219.99886N,11415.77706E,0.065,095134,000.0,141.50,16,0)",
      "(864768011624589,DW30,090319,A,2219.99922N,11415.77663E,0.040,095144,000.0,142.60,16,0)",
      "(864768011624589,DW30,090319,A,2219.99985N,11415.77686E,0.007,095154,000.0,143.50,15,0)",
      "(864768011624589,DW30,090319,A,2220.00034N,11415.77679E,0.070,095204,000.0,143.90,15,0)",
      "(864768011624589,DW30,090319,A,2220.00054N,11415.77682E,0.021,095214,000.0,143.90,15,0)",
      "(864768011624589,DW30,090319,A,2219.99993N,11415.77673E,0.031,095224,000.0,144.60,15,0)", "(864768011624589,DW30,090319,A,2219.99915N,11415.77659E,0.109,095234,000.0,145.70,15,0)",
      "(864768011624589,DW30,090319,A,2219.99796N,11415.77753E,0.031,095244,000.0,148.30,15,0)",
      "(864768011624589,DW30,090319,A,2219.99738N,11415.77874E,0.087,095254,000.0,149.30,15,0)",
      "(864768011624589,DW30,090319,A,2219.99783N,11415.77891E,0.165,095304,000.0,149.20,15,0)",
      "(864768011624589,DW30,090319,A,2219.99880N,11415.77857E,0.052,095314,000.0,147.00,15,0)",
      "(864768011624589,DW30,090319,A,2219.99914N,11415.77854E,0.121,095324,000.0,147.20,15,0)", "(864768011624589,DW30,090319,A,2219.99938N,11415.77860E,0.009,095334,000.0,147.20,15,0)",
      "(864768011624589,DW30,090319,A,2219.99954N,11415.77864E,0.125,095342,000.0,147.40,15,0)",
      "(864768011624589,DW30,090319,A,2219.99989N,11415.77771E,0.418,095352,97.25,146.40,16,0)",
      "(864768011624589,DW30,090319,A,2219.99932N,11415.77845E,0.338,095402,000.0,146.10,16,0)",
      "(864768011624589,DW30,090319,A,2219.99855N,11415.77858E,0.112,095412,000.0,146.30,16,0)",
      "(864768011624589,DW30,090319,A,2219.99820N,11415.77821E,0.269,095422,000.0,146.00,16,0)", "(864768011624589,DW30,090319,A,2219.99801N,11415.77834E,0.682,095432,000.0,145.90,16,0)",
      "(864768011624589,DW30,090319,A,2219.99835N,11415.77672E,0.680,095442,000.0,141.70,16,0)",
      "(864768011624589,DW30,090319,A,2219.99843N,11415.77637E,0.312,095452,000.0,141.00,16,0)",
      "(864768011624589,DW30,090319,A,2219.99792N,11415.77687E,0.135,095502,000.0,141.30,16,0)",
      "(864768011624589,DW30,090319,A,2219.99718N,11415.77744E,0.122,095512,000.0,140.20,16,0)",
      "(864768011624589,DW30,090319,A,2219.99714N,11415.77737E,0.034,095522,000.0,139.60,16,0)",
      "(864768011624589,DW30,090319,A,2219.99723N,11415.77702E,0.075,095532,000.0,140.20,16,0)",
      "(864768011624589,DW30,090319,A,2219.99755N,11415.77661E,0.077,095542,000.0,140.80,16,0)",
      "(864768011624589,DW30,090319,A,2219.98885N,11415.78610E,5.629,095552,143.25,142.50,16,0)",
      "(864768011624589,DW30,090319,A,2219.97625N,11415.79391E,11.619,095602,162.27,138.60,16,0)",
      "(864768011624589,DW30,090319,A,2219.92611N,11415.79029E,18.895,095612,193.92,134.50,16,0)",
      "(864768011624589,DW30,090319,A,2219.88032N,11415.77549E,9.895,095622,191.53,142.50,16,0)",
      "(864768011624589,DW30,090319,A,2219.85588N,11415.76043E,0.119,095632,000.0,136.50,16,0)",
      "(864768011624589,DW30,090319,A,2219.85547N,11415.75815E,0.264,095642,000.0,131.40,16,0)",
      "(864768011624589,DW30,090319,A,2219.85560N,11415.75700E,0.271,095652,000.0,128.90,16,0)",
      "(864768011624589,DW30,090319,A,2219.85457N,11415.75499E,0.056,095702,000.0,127.70,15,0)",
      "(864768011624589,DW30,090319,A,2219.85398N,11415.75368E,0.119,095712,000.0,127.20,15,0)",
      "(864768011624589,ZC20,090319,095722,5,385,227,1)",
      "(864768011624589,DW30,090319,A,2219.85303N,11415.75229E,0.119,095722,000.0,126.90,15,0)", "(864768011624589,DW30,090319,A,2219.85864N,11415.72680E,14.003,095802,317.96,129.10,16,0)",
      "(864768011624589,DW30,090319,A,2219.90925N,11415.69383E,23.839,095812,335.61,129.10,15,0)",
      "(864768011624589,DW30,090319,A,2219.97621N,11415.66114E,25.054,095822,337.55,129.10,15,0)", "(864768011624589,DW30,090319,A,2220.04413N,11415.62958E,28.246,095832,336.25,131.10,15,0)",
      "(864768011624589,DW30,090319,A,2220.12274N,11415.59803E,31.273,095842,341.42,130.70,15,0)",
      "(864768011624589,DW30,090319,A,2220.19411N,11415.56905E,23.396,095852,338.73,134.00,16,0)",
      "(864768011624589,DW30,090319,A,2220.26554N,11415.54490E,27.463,095902,344.78,137.10,16,1)",
      "(864768011624589,DW30,090319,A,2220.33421N,11415.53624E,23.787,095912,12.61,135.60,16,1)",
      "(864768011624589,DW30,090319,A,2220.37563N,11415.53888E,16.679,095922,354.28,135.00,16,1)",
      "(864768011624589,DW30,090319,A,2220.42926N,11415.49898E,27.952,095932,310.25,132.70,16,1)",
      "(864768011624589,DW30,090319,A,2220.48181N,11415.43417E,28.516,095942,315.21,137.30,16,1)",
      "(864768011624589,DW30,090319,A,2220.53660N,11415.37104E,21.351,095952,313.19,151.20,16,1)",
      "(864768011624589,DW30,090319,A,2220.58225N,11415.32628E,22.471,100002,305.19,161.80,16,1)",
      "(864768011624589,DW30,090319,A,2220.60699N,11415.26865E,16.804,100012,293.69,168.10,16,1)",
      "(864768011624589,DW30,090319,A,2220.62874N,11415.21595E,18.792,100022,294.76,174.20,16,1)",
      "(864768011624589,DW30,090319,A,2220.63725N,11415.15777E,18.608,100032,241.62,175.50,16,2)",
      "(864768011624589,DW30,090319,A,2220.60397N,11415.11893E,18.121,100042,243.11,182.40,17,2)",
      "(864768011624589,DW30,090319,A,2220.58947N,11415.06756E,15.133,100052,267.42,184.10,17,2)",
      "(864768011624589,DW30,090319,A,2220.59190N,11415.00306E,22.624,100102,257.41,184.60,16,2)",
      "(864768011624589,DW30,090319,A,2220.56517N,11414.93901E,25.212,100112,222.32,206.40,17,2)",
      "(864768011624589,DW30,090319,A,2220.50803N,11414.91015E,21.798,100122,197.53,225.90,17,2)",
      "(864768011624589,DW30,090319,A,2220.45147N,11414.88020E,21.551,100132,221.28,238.50,17,2)",
      "(864768011624589,DW30,090319,A,2220.41005N,11414.83203E,21.928,100142,229.29,241.10,17,2)",
      "(864768011624589,DW30,090319,A,2220.36866N,11414.78104E,25.134,100152,227.83,242.60,17,2)",
      "(864768011624589,DW30,090319,A,2220.32330N,11414.72676E,24.044,100202,229.16,238.00,17,3)",
      "(864768011624589,DW30,090319,A,2220.29491N,11414.65879E,23.939,100212,259.52,225.90,16,3)",
      "(864768011624589,DW30,090319,A,2220.24988N,11414.59987E,29.855,100222,217.98,211.90,16,3)",
      "(864768011624589,DW30,090319,A,2220.18411N,11414.54342E,31.223,100232,216.58,197.50,16,3)",
      "(864768011624589,DW30,090319,A,2220.12039N,11414.49047E,24.094,100242,220.29,207.00,16,3)",
      "(864768011624589,DW30,090319,A,2220.08848N,11414.42001E,26.691,100252,258.99,206.60,17,3)",
      "(864768011624589,DW30,090319,A,2220.06866N,11414.33026E,28.163,100302,251.54,195.90,17,3)",
      "(864768011624589,DW30,090319,A,2220.03843N,11414.24728E,28.031,100312,245.72,196.60,17,3)",
      "(864768011624589,DW30,090319,A,2220.00855N,11414.16028E,26.294,100322,257.53,202.60,17,4)",
      "(864768011624589,DW30,090319,A,2219.99625N,11414.07707E,28.661,100332,264.87,211.50,16,4)",
      "(864768011624589,DW30,090319,A,2220.03271N,11413.98660E,34.738,100342,301.30,220.00,16,4)",
      "(864768011624589,DW30,090319,A,2220.06430N,11413.89413E,32.374,100352,292.19,212.40,16,4)",
      "(864768011624589,DW30,090319,A,2220.08291N,11413.80444E,26.760,100402,267.15,214.70,16,4)",
      "(864768011624589,DW30,090319,A,2220.06972N,11413.74598E,7.024,100412,254.69,200.20,16,4)",
      "(864768011624589,DW30,090319,A,2220.06177N,11413.73123E,8.691,100422,257.42,181.00,16,4)",
      "(864768011624589,DW30,090319,A,2220.05806N,11413.68074E,20.298,100432,271.18,170.90,16,4)",
      "(864768011624589,DW30,090319,A,2220.06003N,11413.63434E,10.240,100442,301.94,167.30,16,5)",
      "(864768011624589,DW30,090319,A,2220.06637N,11413.60467E,16.482,100452,245.58,167.50,16,5)",
      "(864768011624589,DW30,090319,A,2220.05362N,11413.54211E,20.503,100502,265.40,169.20,16,5)",
      "(864768011624589,DW30,090319,A,2220.05048N,11413.48582E,18.181,100512,285.52,168.30,16,5)"
    ]

    var gps_position_points = []
    raw_data.forEach(d => {
      if(d.indexOf("DW30")>0)
      {
        var row_d = d.split(",")
        var lat = row_d[4]
        var lon = row_d[5]

        // lat = DDMM.MMMMM => DD + MM.MMMM/60
        // lon = DDDMM.MMMMM => DDD + MM.MMMM/60

        var real_lat = parseFloat(lat.substring(0,2)) + parseFloat(lat.substring(2,(lat.length-1)))/60
        var real_lon = parseFloat(lon.substring(0,3)) + parseFloat(lon.substring(3,(lon.length-1)))/60
        var print_point = {location:{lat:real_lat,lng:real_lon}};
        gps_position_points.push(print_point)
      }
    })


    this.setState({
      gps_print_points: gps_position_points
    })
  }

  renderGuates = () => {
    var { cars } = this.state;
    if(cars.length > 4)
      cars = cars.slice(0, 4)
    return cars.map((car, index) => {
      return (
        <Col md={3} className="guate-outter-div" key={'record-'+index}>
          <div className="guate-div">
            <h7>
              <Row>
                <Col sm={6}>
                  {car.license} <br/>
                  Route: {car.route} <br/>
                  Seq: {car.currentState.seq} <br/>
                  Location: S {car.currentState.passedStation} <br/>
                </Col>
                <Col sm={6}>
                  <RadialGauge
                    width= {this.state.gauages_size}
                    height= {this.state.gauages_size}
                    units= "M/s"
                    minValue= {0}
                    maxValue= {120}
                    majorTicks= {[
                        "0",
                        "10",
                        "20",
                        "30",
                        "40",
                        "50",
                        "60",
                        "70",
                        "80",
                        "90",
                        "100",
                        "110",
                        "120"
                    ]}
                    minorTicks = {2}
                    strokeTicks = {true}
                    highlights = {[
                        {
                            "from": 90,
                            "to": 120,
                            "color": "rgba(200, 50, 50, .75)"
                        }
                    ]}
                    colorPlate= "#fff"
                    borderShadowWidth= {0}
                    borders= {false}
                    needleType= "arrow"
                    needleWidth= {2}
                    needleCircleSize= {7}
                    needleCircleOuter= {true}
                    needleCircleInner= {false}
                    animationDuration= {1500}
                    animationRule= "linear"
                    value = {car.currentState.speed*60*60/1000}
                    ></RadialGauge>
                </Col>
              </Row>
            </h7>
          </div>
        </Col>
      )
    })
  }

  render() {
    const cars = this.state.cars;
    var x = this.state.x;
    var y = this.state.y;
    return (
      <div onMouseMove={this._onMouseMove.bind(this)}>
      <div className="tooltip hidden_tooltip" style={{'top':y+10, 'left':x+10}}>

      </div>
        <Container>
          <Row>
            <Col sm={1} className="sidebar">
              <div className="icon-div">
                <img src="assets/socif_icon.png" />
              </div>
              <div className="sidebar-manu">
                <ul>
                  <li><h6><FaHome/> Home</h6></li>
                  <li><h6><FaMap/> Map</h6></li>
                  <li><h6><FaUsers/> User</h6></li>
                </ul>
              </div>
            </Col>
            <Col sm={11}>
              <Row className="header">
                <div className="dashboard-name">
                  <h4>Dashboard</h4>
                </div>
              </Row>

              <Row className="main">
                {this.renderGuates()}
              </Row>
              <Row className="main">
                <Col md={4} className="charts-outter-div">
                  <div className="charts-div">
                    <svg className="stacked-chart" id="stacked-chart">
                    </svg>
                  </div>
                </Col>
                <Col md={4} className="charts-outter-div">
                  <div className="charts-div">
                    <div id="chart"></div>
                  </div>
                </Col>
                <Col md={4} className="charts-outter-div">
                  <div className="charts-div">
                    <div className="weather-div">
                      <h5>Hong Kong</h5>
                      <h3>{this.state.weather.temp}°C</h3>
                      <Row className="weather-row">
                        <Col md={4}>
                          <h6><GoArrowUp/> {this.state.weather.max_temp}°C</h6>
                        </Col>
                        <Col md={8}>
                          <h6><WiHumidity/> {this.state.weather.humidity} %</h6>
                        </Col>
                      </Row>
                      <Row className="weather-row">
                        <Col md={4}>
                          <h6><GoArrowDown/> {this.state.weather.min_temp}°C</h6>
                        </Col>
                        <Col md={8}>
                          <h6><WiStrongWind/> {this.state.weather.wind} M/s</h6>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </Col>
              </Row>

              <Row className="main">
                <Col md={12} className="map-outter-div">
                  <div className="map-div">
                    <Map
                    google={this.props.google}
                    zoom={13}
                    initialCenter={{
                      lat: 22.333165,
                      lng: 114.245228
                    }}
                    >
                      {cars.map((car, index) => (
                          <Marker
                            key={'car-'+index}
                            icon={{url: "src/js/containers/WifiTrackerMap/minibus_icon.png"}}
                            position={{lat: car.currentState.location.lat , lng: car.currentState.location.lng}}
                          />
                        )
                      )}
                    </Map>
                  </div>
                </Col>
              </Row>

            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

export default GoogleApiWrapper({
  apiKey: 'AIzaSyCCaUGybfZSgG9RRNtjdrJ15ZmhEuB83Mw'
})(WifiTrackerMap);
