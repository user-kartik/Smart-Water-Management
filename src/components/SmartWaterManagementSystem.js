import React, { Component } from "react";
import io from "socket.io-client";
import './Style.css'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from "recharts";
import axios from "axios";

class SmartWaterManagementSystem extends Component {
  // Constructor and state remain the same
  constructor(props) {
    super(props);
    
    this.state = {
      waterQuality: "98%",
      flowRate: "5.2 L/min",
      leakageStatus: "Normal",
      dailyConsumption: "125 L",
      monthlyConsumption: "3,750 L",
      consumptionData: [
        { time: "10:00", flowRate: 5.2, dailyConsumption: 120, phValue: 7.2, turbidity: 1.5, pressure: 45 },
        { time: "10:01", flowRate: 5.4, dailyConsumption: 125, phValue: 7.3, turbidity: 1.6, pressure: 47 },
        { time: "10:02", flowRate: 5.6, dailyConsumption: 130, phValue: 7.4, turbidity: 1.4, pressure: 46 },
        { time: "10:03", flowRate: 5.8, dailyConsumption: 135, phValue: 7.1, turbidity: 1.7, pressure: 44 },
        { time: "10:04", flowRate: 6.0, dailyConsumption: 140, phValue: 7.0, turbidity: 1.3, pressure: 48 }
      ],
      phValue: 7.0,
      turbidity: 1.2,
      systemPressure: 45,
      historicalData: [],
      usageBreakdown: [
        { name: "Residential", value: 45 },
        { name: "Commercial", value: 30 },
        { name: "Industrial", value: 15 },
        { name: "Other", value: 10 }
      ],
      streetPressure: 20,
      apartmentPressure: 50,
      commercialPressure: 70,
      selectedArea: "Koramangala",
      pressureAlert: false,
      areas: [
        { name: "Koramangala", status: "Active", population: "250K", waterQuality: "98%" },
        { name: "Indiranagar", status: "Active", population: "180K", waterQuality: "97%" },
        { name: "Whitefield", status: "Active", population: "190K", waterQuality: "96%" },
        { name: "HSR Layout", status: "Active", population: "150K", waterQuality: "98%" },
        { name: "JP Nagar", status: "Maintenance", population: "170K", waterQuality: "95%" },
        { name: "Jayanagar", status: "Active", population: "200K", waterQuality: "97%" }
      ]
    };
  }

  componentDidMount() {
    // Connect to socket server
    this.socket = io("http://localhost:5000");
    this.setupSocketListeners();
    this.fetchHistoricalData();
    this.startDataStorage();
    this.startUpdatingMetrics();
  }

  componentWillUnmount() {
    // Cleanup socket connection
    if (this.socket) {
      this.socket.disconnect();
    }
    // Clear any intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.dataStorageInterval) {
      clearInterval(this.dataStorageInterval);
    }
  }

  setupSocketListeners() {
    this.socket.on("sensorData", (data) => {
      const numericFlowRate = parseFloat(data.flowRate);
      const numericConsumption = parseFloat(data.dailyConsumption);

      this.setState((prevState) => ({
        waterQuality: data.waterQuality || prevState.waterQuality,
        flowRate: data.flowRate || prevState.flowRate,
        leakageStatus: data.leakageStatus || prevState.leakageStatus,
        dailyConsumption: data.dailyConsumption || prevState.dailyConsumption,
        monthlyConsumption: data.monthlyConsumption || prevState.monthlyConsumption,
        phValue: (Math.random() * (8.5 - 6.5) + 6.5).toFixed(2),
        turbidity: (Math.random() * 5).toFixed(2),
        systemPressure: (Math.random() * (60 - 30) + 30).toFixed(1),
        consumptionData: [
          ...prevState.consumptionData.slice(-30),
          {
            time: new Date().toLocaleTimeString(),
            flowRate: numericFlowRate,
            dailyConsumption: numericConsumption,
            phValue: parseFloat(prevState.phValue),
            turbidity: parseFloat(prevState.turbidity),
            pressure: parseFloat(prevState.systemPressure)
          }
        ]
      }));

      if (parseFloat(this.state.systemPressure) > 80) {
        this.setState({ pressureAlert: true });
        setTimeout(() => this.setState({ pressureAlert: false }), 3000);
      }
    });
  }

  async fetchHistoricalData() {
    try {
      const response = await axios.get("http://localhost:5000/metrics");
      this.setState({ historicalData: response.data });
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  }

  startDataStorage() {
    this.dataStorageInterval = setInterval(async () => {
      const metrics = {
        water_supplied_per_minute: parseFloat(this.state.flowRate),
        total_water_supplied: parseFloat(this.state.dailyConsumption),
        ph_value: parseFloat(this.state.phValue),
        system_pressure: parseFloat(this.state.systemPressure),
        turbidity: parseFloat(this.state.turbidity),
        daily_consumption: parseFloat(this.state.dailyConsumption)
      };

      try {
        await axios.post("http://localhost:5000/metrics", metrics);
      } catch (error) {
        console.error("Error storing metrics:", error);
      }
    }, 1000);
  }

  startUpdatingMetrics() {
    this.metricsInterval = setInterval(() => {
      this.setState((prevState) => ({
        phValue: (Math.random() * (8.5 - 6.5) + 6.5).toFixed(2),
        turbidity: (Math.random() * 5).toFixed(2),
        systemPressure: (Math.random() * (60 - 30) + 30).toFixed(1),
        consumptionData: [
          ...prevState.consumptionData.slice(-30),
          {
            time: new Date().toLocaleTimeString(),
            flowRate: parseFloat(prevState.flowRate),
            dailyConsumption: parseFloat(prevState.dailyConsumption),
            phValue: parseFloat(prevState.phValue),
            turbidity: parseFloat(prevState.turbidity),
            pressure: parseFloat(prevState.systemPressure)
          }
        ]
      }));
    }, 1000);
  }

  handlePressureChange = (section, value) => {
    const numericValue = parseInt(value, 10);
    switch (section) {
      case "street":
        this.setState({ streetPressure: numericValue });
        break;
      case "apartment":
        this.setState({ apartmentPressure: numericValue });
        break;
      case "commercial":
        this.setState({ commercialPressure: numericValue });
        break;
      default:
        break;
    }
  };

  handleAreaChange = (event) => {
    this.setState({ selectedArea: event.target.value });
  };

  handleAreaSelect = (areaName) => {
    this.setState({ selectedArea: areaName });
  };

  render() {
    const { 
      consumptionData, 
      usageBreakdown, 
      streetPressure, 
      apartmentPressure, 
      commercialPressure, 
      selectedArea, 
      pressureAlert, 
      areas 
    } = this.state;
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
      <div className="container">
        <header className="main-header">
          <div className="logo">
            <span className="logo-icon">💧</span>
            <span className="logo-text">AquaSmart</span>
          </div>
          <nav className="main-nav">
            <ul>
              {["Dashboard", "Usage", "Billing", "Settings"].map(item => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`}>{item}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Water Quality</h3>
            <p className="metric-value">{this.state.waterQuality}</p>
          </div>
          <div className="metric-card">
            <h3>Flow Rate</h3>
            <p className="metric-value">{this.state.flowRate}</p>
          </div>
          <div className="metric-card">
            <h3>Daily Usage</h3>
            <p className="metric-value">{this.state.dailyConsumption}</p>
          </div>
          <div className="metric-card">
            <h3>System Pressure</h3>
            <p className="metric-value">{this.state.systemPressure} PSI</p>
          </div>
        </div>

        {pressureAlert && (
          <div className="alert alert-warning">
            <p>⚠ High Pressure Alert! Pressure is above 80 PSI.</p>
          </div>
        )}

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Real-time Flow Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="flowRate" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Usage Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usageBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {usageBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Water Quality Metrics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="phValue" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="turbidity" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>System Pressure History</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pressure" fill="#413ea0" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="area-selection">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Bangalore Water Management Zones</h2>
          <div className="area-grid">
            {areas.map((area) => (
              <div
                key={area.name}
                className={`area-card ${selectedArea === area.name ? 'selected' : ''}`}
                onClick={() => this.handleAreaSelect(area.name)}
              >
                <h3 className="text-lg font-semibold">{area.name}</h3>
                <p>Status: {area.status}</p>
                <p>Population: {area.population}</p>
                <p>Water Quality: {area.waterQuality}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="water-control-container">
          <div className="pressure-control">
            <h3>
              <i className="fas fa-map-marker-alt icon-pulse"></i>
              Select Bangalore Area
            </h3>
            <select value={selectedArea} onChange={this.handleAreaChange} className="area-dropdown">
              <option value="Bangalore Central">Bangalore Central</option>
              <option value="Koramangala">Koramangala</option>
              <option value="Whitefield">Whitefield</option>
              <option value="Indiranagar">Indiranagar</option>
              <option value="MG Road">MG Road</option>
              <option value="Jayanagar">Jayanagar</option>
            </select>
            <p>Current Area: {selectedArea}</p>
          </div>

          <div className="pressure-control">
            <h3>
              <i className="fas fa-home icon-pulse"></i>
              Street Supply
            </h3>
            <p>The water supply will be from 6:00 AM - 6:00 PM</p>
            <p>Water is distributed at a lower pressure, ensuring supply lasts throughout the day.</p>
            <input
              type="range"
              min="10"
              max="30"
              value={streetPressure}
              className={streetPressure > 25 ? "high-pressure" : ""}
              onChange={(e) => this.handlePressureChange("street", e.target.value)}
            />
            <span className="pressure-value">{streetPressure} PSI</span>
          </div>

          <div className="pressure-control">
            <h3>
              <i className="fas fa-building icon-pulse"></i>
              Apartment Supply
            </h3>
            
            <p>The water supply will be from 6:00 AM - 9:00 AM</p>
            <p>Water is supplied at higher pressure for apartment complexes, especially for upper floors.</p>
            <input
              type="range"
              min="30"
              max="100"
              value={apartmentPressure}
              className={apartmentPressure > 70 ? "high-pressure" : ""}
              onChange={(e) => this.handlePressureChange("apartment", e.target.value)}
            />
            <span className="pressure-value">{apartmentPressure} PSI</span>
          </div>

          <div className="pressure-control">
            <h3>
              <i className="fas fa-industry icon-pulse"></i>
              Commercial Supply
            </h3>
            <p>The water supply will be from 6:00 AM - 12:00 AM</p>
            <p>Commercial areas receive the highest pressure to maintain a strong water supply.</p>
            <input
              type="range"
              min="50"
              max="150"
              value={commercialPressure}
              className={commercialPressure > 100 ? "high-pressure" : ""}
              onChange={(e) => this.handlePressureChange("commercial", e.target.value)}
            />
            <span className="pressure-value">{commercialPressure} PSI</span>
          </div>
        </div>

        <main className="main-content">
          {this.state.leakageStatus !== "Normal" && (
            <div className="alert alert-danger">
              <p>⚠ Leak detected! Please check your water system.</p>
            </div>
          )}
        </main>

        <footer className="main-footer">
          <p>&copy; {new Date().getFullYear()} AquaSmart. All Rights Reserved.</p>
        </footer>
      </div>
    );
  }
}

export default SmartWaterManagementSystem;