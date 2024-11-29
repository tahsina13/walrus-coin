import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function BandwidthChart({ data }): JSX.Element {
    const chartData = {
        labels: data.map(entry => entry.timestamp),
        datasets: [
            {
                label: "BANDWIDTH OVER TIME",
                data: data.map(entry => entry.bandwidth),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
            },
        ],
    };

    const options = {
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'hour',
            },
          },
          y: {
            beginAtZero: true,
          },
        },
      };
      

    return(
        <div>
        <h2>Bandwidth Over Time</h2>
        <Line data={chartData}  />
        </div>
    )
}

export default BandwidthChart