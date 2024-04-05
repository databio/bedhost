import { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { components } from '../../../../bedbase-types';
import { PRIMARY_COLOR } from '../../../const';
import { formatNumberWithCommas, roundToTwoDecimals } from '../../../utils';

type BedMetadata = components['schemas']['BedMetadata'];
type Props = {
  metadata: BedMetadata;
};

export const GenomicFeatureBar = (props: Props) => {
  const { metadata } = props;

  const [displayAsPercentage, setDisplayAsPercentage] = useState(true);

  let data = [];

  if (displayAsPercentage) {
    data = [
      {
        feature: "3' UTR",
        value: roundToTwoDecimals((metadata.stats?.threeutr_percentage || 0) * 100),
      },
      {
        feature: "5' UTR",
        value: roundToTwoDecimals((metadata.stats?.fiveutr_percentage || 0) * 100),
      },
      {
        feature: 'Exon',
        value: roundToTwoDecimals((metadata.stats?.exon_percentage || 0) * 100),
      },
      {
        feature: 'Intron',
        value: roundToTwoDecimals((metadata.stats?.intron_percentage || 0) * 100),
      },
      {
        feature: 'Intergenic',
        value: roundToTwoDecimals((metadata.stats?.intergenic_percentage || 0) * 100),
      },
      {
        feature: 'Promoter proc',
        value: roundToTwoDecimals((metadata.stats?.promoterprox_percentage || 0) * 100),
      },
      {
        feature: 'Promoter core',
        value: roundToTwoDecimals((metadata.stats?.promotercore_percentage || 0) * 100),
      },
    ];
  } else {
    data = [
      {
        feature: "3' UTR",
        value: metadata.stats?.threeutr_frequency || 0,
      },
      {
        feature: "5' UTR",
        value: metadata.stats?.fiveutr_frequency || 0,
      },
      {
        feature: 'Exon',
        value: metadata.stats?.exon_frequency || 0,
      },
      {
        feature: 'Intron',
        value: metadata.stats?.intron_frequency || 0,
      },
      {
        feature: 'Intergenic',
        value: metadata.stats?.intergenic_frequency || 0,
      },
      {
        feature: 'Promoter proc',
        value: metadata.stats?.promoterprox_frequency || 0,
      },
      {
        feature: 'Promoter core',
        value: metadata.stats?.promotercore_frequency || 0,
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
        <div className="d-flex justify-content-center w-100 genomic-feature-bar-height">
          <ResponsiveBar
            data={data}
            borderWidth={1}
            keys={['value']}
            indexBy="feature"
            margin={{ top: 50, right: 10, bottom: 50, left: 60 }}
            layout="vertical"
            colors={[PRIMARY_COLOR]}
            theme={{
              text: {
                color: 'black',
                fontFamily: 'Arial',
                fontSize: 14,
              },
            }}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            markers={[
              {
                axis: 'y',
                value: 0,
                lineStyle: { stroke: 'black', strokeWidth: 2 },
                legend: '',
                legendOrientation: 'vertical',
                legendPosition: 'top',
              },

              {
                axis: 'x',
                value: 0,
                lineStyle: { stroke: 'black', strokeWidth: 2 },
                legend: '',
                legendOrientation: 'vertical',
                legendPosition: 'top',
              },
            ]}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Feature',
              legendPosition: 'middle',
              legendOffset: 42,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: displayAsPercentage ? 'Frequency (%)' : 'Frequency',
              legendPosition: 'middle',
              legendOffset: displayAsPercentage ? -40 : -48,
            }}
            enableGridY={false}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
            valueFormat={(value) => (displayAsPercentage ? `${value}%` : formatNumberWithCommas(value))}
          />
        </div>
      </div>
    </div>
  );
};
