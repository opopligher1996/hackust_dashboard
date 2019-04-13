import React, { Component } from 'react';


class TestingMap extends Component {

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

  }

  render() {
    const cars = this.state.cars;
    var x = this.state.x;
    var y = this.state.y;
    return (
      <div>
      </div>
    )
  }
}

export default TestingMap;
