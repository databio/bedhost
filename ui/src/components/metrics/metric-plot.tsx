import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

export type MetricPlotType = 'bar' | 'pie';

type Props = {
  type: MetricPlotType;
  data: [string, number][];
  dataLabel?: string;
  backgroundColor: string[];
  borderWidth: number;
  sliceIndex: number;
  plotRef?: any;
};

export const MetricPlot = (props: Props) => {
  const { type, data, dataLabel, backgroundColor, borderWidth, sliceIndex, plotRef } = props;

  const sortedData = data.sort((a, b) => b[1] - a[1]).slice(0, sliceIndex);
  const labels = sortedData.map(entry => entry[0]);
  const values = sortedData.map(entry => entry[1]);

  // Function to generate a color palette with the same length as the data
  const generateColorPalette = (dataLength: number): string[] => {

    const baseColors = [
      'rgba(255, 99, 132, 0.6)',   // red
      'rgba(54, 162, 235, 0.6)',   // blue
      'rgba(255, 206, 86, 0.6)',   // yellow
      'rgba(51,193,43,0.6)',   // teal
      'rgba(153, 102, 255, 0.6)',  // purple
      'rgba(255, 159, 64, 0.6)',   // orange
      'rgba(199, 199, 199, 0.6)',  // gray
      'rgba(83, 102, 255, 0.6)',   // indigo
      'rgba(255, 99, 255, 0.6)',   // pink
      'rgb(6,80,49)',   // light green
    ];

    let colorPalette = [];

    // If we need more colors than in our base palette,
    // we'll cycle through with different opacities
    const cycles = Math.ceil((dataLength - colorPalette.length) / baseColors.length);

    for (let cycle = 0; cycle < cycles; cycle++) {
      // For each cycle, adjust opacity slightly
      const opacity = 0.6 - (cycle * 0.1);

      for (let i = 0; i < baseColors.length; i++) {
        if (colorPalette.length >= dataLength) break;

        // Create a new color with adjusted opacity
        const baseColor = baseColors[i];
        const rgbPart = baseColor.substring(0, baseColor.lastIndexOf(','));
        const newColor = `${rgbPart}, ${opacity})`;

        colorPalette.push(newColor);
      }
    }

    return colorPalette;
  };

  const ensureColorPalette = (data: [string, number][]): string[] => {
    return generateColorPalette(data.length);
  };

  const plotData = {
    labels: labels,
    datasets: [
      {
        label: dataLabel,
        data: values,
        backgroundColor: type === 'bar' ? backgroundColor : ensureColorPalette(data),
        borderWidth: borderWidth,
      },
    ],
  };

  const plotOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      datalabels: {
        font: {
          size: 10,
        },
        align: 'end' as const,
        offset: 2,
      },
    },
  };

  if (type === 'bar') {
    return (
      <Bar
        ref={plotRef}
        data={plotData}
        options={plotOptions}
      />
    );
  } else if (type === 'pie') {
    return (
      <Pie
        ref={plotRef}
        data={plotData}
        options={plotOptions}
      />
    );
  }

  return null;
};
