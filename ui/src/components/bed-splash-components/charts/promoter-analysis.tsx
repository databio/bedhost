import { ResponsiveBar } from '@nivo/bar';
import { components } from '../../../../bedbase-types';
import { PRIMARY_COLOR } from '../../../const';
import { roundToTwoDecimals } from '../../../utils';

type BedMetadata = components['schemas']['BedMetadata'];
type Props = {
  metadata: BedMetadata;
};

export const PromoterAnalysisBar = (props: Props) => {
  const { metadata } = props;
  return (
    <div className="border rounded p-2 shadow-sm">
      <div className="d-flex flex-column align-items-center justify-content-between h-100">
        <h4 className="fw-bold text-base">Promoter analysis</h4>
        <div className="d-flex w-100 text-center promoter-bar-height">
          <ResponsiveBar
            data={[
              {
                feature: 'Promoter proc',
                value: roundToTwoDecimals((metadata.stats?.promoterprox_percentage || 0) * 100),
              },
              {
                feature: 'Promoter core',
                value: roundToTwoDecimals((metadata.stats?.promotercore_percentage || 0) * 100),
              },
            ]}
            keys={['value']}
            indexBy="feature"
            margin={{ top: 50, right: 10, bottom: 50, left: 60 }}
            layout="vertical"
            borderWidth={1}
            colors={[PRIMARY_COLOR]}
            theme={{
              text: {
                color: 'black',
                fontFamily: 'Arial',
                fontSize: 14,
              },
            }}
            borderColor={{ from: 'color', modifiers: [['darker', 3]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Promoter type',
              legendPosition: 'middle',
              legendOffset: 32,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Frequency (%)',
              legendPosition: 'middle',
              legendOffset: -40,
            }}
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
            enableGridX={false}
            enableGridY={false}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
          />
        </div>
        <div className="text-end">
          <p className="text-center mb-0 text-sm text-primary">Learn more</p>
        </div>
      </div>
    </div>
  );
};
