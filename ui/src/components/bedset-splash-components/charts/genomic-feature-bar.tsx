import { components } from '../../../../bedbase-types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { BarWithErrorBar, BarWithErrorBarsController, PointWithErrorBar } from 'chartjs-chart-error-bars';
import { PRIMARY_COLOR } from '../../../const';
import { roundToTwoDecimals } from '../../../utils';
import { useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarWithErrorBarsController,
  BarWithErrorBar,
  PointWithErrorBar,
);

type BedSetMetadata = components['schemas']['BedSetMetadata'];
type Props = {
  metadata: BedSetMetadata;
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

export const GenomicFeatureBar = (props: Props) => {
  const { metadata } = props;
  const [displayAsPercentage, setDisplayAsPercentage] = useState(true);

  let data = [];

  if (displayAsPercentage) {
    data = [
      {
        feature: "3' UTR",
        value: roundToTwoDecimals((metadata.statistics?.mean?.threeutr_percentage || 0) * 100),
        // mean - sd
        yMin: roundToTwoDecimals(
          (metadata.statistics?.mean?.threeutr_percentage || 0) * 100 -
            (metadata.statistics?.sd?.threeutr_percentage || 0) * 100,
        ),
        // mean + sd
        yMax: roundToTwoDecimals(
          (metadata.statistics?.mean?.threeutr_percentage || 0) * 100 +
            (metadata.statistics?.sd?.threeutr_percentage || 0) * 100,
        ),
      },
      {
        feature: "5' UTR",
        value: roundToTwoDecimals((metadata.statistics?.mean?.fiveutr_percentage || 0) * 100),
        yMin: roundToTwoDecimals(
          (metadata.statistics?.mean?.fiveutr_percentage || 0) * 100 -
            (metadata.statistics?.sd?.fiveutr_percentage || 0) * 100,
        ),
        yMax: roundToTwoDecimals(
          (metadata.statistics?.mean?.fiveutr_percentage || 0) * 100 +
            (metadata.statistics?.sd?.fiveutr_percentage || 0) * 100,
        ),
      },
      {
        feature: 'Exon',
        value: roundToTwoDecimals((metadata.statistics?.mean?.exon_percentage || 0) * 100),
        yMin: roundToTwoDecimals(
          (metadata.statistics?.mean?.exon_percentage || 0) * 100 -
            (metadata.statistics?.sd?.exon_percentage || 0) * 100,
        ),
        yMax: roundToTwoDecimals(
          (metadata.statistics?.mean?.exon_percentage || 0) * 100 +
            (metadata.statistics?.sd?.exon_percentage || 0) * 100,
        ),
      },
      {
        feature: 'Intron',
        value: roundToTwoDecimals((metadata.statistics?.mean?.intron_percentage || 0) * 100),
        yMin: roundToTwoDecimals(
          (metadata.statistics?.mean?.intron_percentage || 0) * 100 -
            (metadata.statistics?.sd?.intron_percentage || 0) * 100,
        ),
        yMax: roundToTwoDecimals(
          (metadata.statistics?.mean?.intron_percentage || 0) * 100 +
            (metadata.statistics?.sd?.intron_percentage || 0) * 100,
        ),
      },
      {
        feature: 'Intergenic',
        value: roundToTwoDecimals((metadata.statistics?.mean?.intergenic_percentage || 0) * 100),
        yMin: roundToTwoDecimals(
          (metadata.statistics?.mean?.intergenic_percentage || 0) * 100 -
            (metadata.statistics?.sd?.intergenic_percentage || 0) * 100,
        ),
        yMax: roundToTwoDecimals(
          (metadata.statistics?.mean?.intergenic_percentage || 0) * 100 +
            (metadata.statistics?.sd?.intergenic_percentage || 0) * 100,
        ),
      },
      {
        feature: 'Promoter proc',
        value: roundToTwoDecimals((metadata.statistics?.mean?.promoterprox_percentage || 0) * 100),
        yMin: roundToTwoDecimals(
          (metadata.statistics?.mean?.promoterprox_percentage || 0) * 100 -
            (metadata.statistics?.sd?.promoterprox_percentage || 0) * 100,
        ),
        yMax: roundToTwoDecimals(
          (metadata.statistics?.mean?.promoterprox_percentage || 0) * 100 +
            (metadata.statistics?.sd?.promoterprox_percentage || 0) * 100,
        ),
      },
      {
        feature: 'Promoter core',
        value: roundToTwoDecimals((metadata.statistics?.mean?.promotercore_percentage || 0) * 100),
        yMin: roundToTwoDecimals(
          (metadata.statistics?.mean?.promotercore_percentage || 0) * 100 -
            (metadata.statistics?.sd?.promotercore_percentage || 0) * 100,
        ),
        yMax: roundToTwoDecimals(
          (metadata.statistics?.mean?.promotercore_percentage || 0) * 100 +
            (metadata.statistics?.sd?.promotercore_percentage || 0) * 100,
        ),
      },
    ];
  } else {
    data = [
      {
        feature: "3' UTR",
        value: metadata.statistics?.mean?.threeutr_frequency || 0,
        yMin: (metadata.statistics?.mean?.threeutr_frequency || 0) - (metadata.statistics?.sd?.threeutr_frequency || 0),
        yMax: (metadata.statistics?.mean?.threeutr_frequency || 0) + (metadata.statistics?.sd?.threeutr_frequency || 0),
      },
      {
        feature: "5' UTR",
        value: metadata.statistics?.mean?.fiveutr_frequency || 0,
        yMin: (metadata.statistics?.mean?.fiveutr_frequency || 0) - (metadata.statistics?.sd?.fiveutr_frequency || 0),
        yMax: (metadata.statistics?.mean?.fiveutr_frequency || 0) + (metadata.statistics?.sd?.fiveutr_frequency || 0),
      },
      {
        feature: 'Exon',
        value: metadata.statistics?.mean?.exon_frequency || 0,
        yMin: (metadata.statistics?.mean?.exon_frequency || 0) - (metadata.statistics?.sd?.exon_frequency || 0),
        yMax: (metadata.statistics?.mean?.exon_frequency || 0) + (metadata.statistics?.sd?.exon_frequency || 0),
      },
      {
        feature: 'Intron',
        value: metadata.statistics?.mean?.intron_frequency || 0,
        yMin: (metadata.statistics?.mean?.intron_frequency || 0) - (metadata.statistics?.sd?.intron_frequency || 0),
        yMax: (metadata.statistics?.mean?.intron_frequency || 0) + (metadata.statistics?.sd?.intron_frequency || 0),
      },
      {
        feature: 'Intergenic',
        value: metadata.statistics?.mean?.intergenic_frequency || 0,
        yMin:
          (metadata.statistics?.mean?.intergenic_frequency || 0) - (metadata.statistics?.sd?.intergenic_frequency || 0),
        yMax:
          (metadata.statistics?.mean?.intergenic_frequency || 0) + (metadata.statistics?.sd?.intergenic_frequency || 0),
      },
      {
        feature: 'Promoter proc',
        value: metadata.statistics?.mean?.promoterprox_frequency || 0,
        yMin:
          (metadata.statistics?.mean?.promoterprox_frequency || 0) -
          (metadata.statistics?.sd?.promoterprox_frequency || 0),
        yMax:
          (metadata.statistics?.mean?.promoterprox_frequency || 0) +
          (metadata.statistics?.sd?.promoterprox_frequency || 0),
      },
      {
        feature: 'Promoter core',
        value: metadata.statistics?.mean?.promotercore_frequency || 0,
        yMin:
          (metadata.statistics?.mean?.promotercore_frequency || 0) -
          (metadata.statistics?.sd?.promotercore_frequency || 0),
        yMax:
          (metadata.statistics?.mean?.promotercore_frequency || 0) +
          (metadata.statistics?.sd?.promotercore_frequency || 0),
      },
    ];
  }

  return (
    <div className="border rounded p-2 shadow-sm">
      <div className="d-flex flex-column align-items-center justify-content-between h-100">
        <div className="d-flex position-relative flex-row align-items-center w-100">
          <h4 className="fw-bold text-base text-center w-100">Genomic Features</h4>
          <div className="position-absolute top-0 end-0 me-1">
            <div className="position-absolute top-0 end-0 me-1">
              <div className="d-flex flex-row align-items-center">
                <i className="bi bi-123 me-2 text-xl"></i>
                <div className="form-check form-switch mx-0">
                  <input
                    className={displayAsPercentage ? 'form-check-input bg-primary border-primary' : 'form-check-input'}
                    type="checkbox"
                    checked={displayAsPercentage}
                    onChange={() => setDisplayAsPercentage(!displayAsPercentage)}
                  />
                  <span className="slider round"></span>
                </div>
                <i className="bi bi-percent"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center w-100 bedset-splash-genomic-feature-bar-height">
          <Chart
            type="barWithErrorBars"
            options={chartOptions}
            data={{
              labels: data.map((d) => d.feature),
              datasets: [
                {
                  label: displayAsPercentage ? 'Percentage' : 'Frequency',
                  data: data.map((d) => {
                    return {
                      // x: d.feature,
                      y: d.value,
                      yMin: d.yMin,
                      yMax: d.yMax,
                    };
                  }),
                  backgroundColor: PRIMARY_COLOR,
                  borderColor: PRIMARY_COLOR,
                  borderWidth: 1,
                },
              ],
            }}
          />
        </div>
        <div className="text-end">
          <p className="text-center mb-0 text-sm text-primary">Learn more</p>
        </div>
      </div>
    </div>
  );
};
