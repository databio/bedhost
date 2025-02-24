import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type Props = {
  type: string;
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

  const plotData = {
    labels: labels,
    datasets: [
      {
        label: dataLabel,
        data: values,
        backgroundColor: backgroundColor,
        borderWidth: borderWidth,
      },
    ],
  };

  const plotOptions = {
    responsive: true,
    maintainAspectRatio: true,
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
  )}

  return null;
};
