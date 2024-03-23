import { ResponsiveBar } from '@nivo/bar';
import { components } from '../../../../bedbase-types';
import { PRIMARY_COLOR } from '../../../const';
import { roundToTwoDecimals } from '../../../utils';

type BedSetMetadata = components['schemas']['BedSetMetadata'];
type Props = {
  metadata: BedSetMetadata;
};

export const GenomicFeatureBar = (props: Props) => {
  const { metadata } = props;
  return (
    <div className="border rounded p-2 shadow-sm">
      <div className="d-flex flex-column align-items-center justify-content-between h-100">
        <h4 className="fw-bold text-base">Genomic Features</h4>
        <div className="d-flex justify-content-center w-100 genomic-feature-bar-height">
          <ResponsiveBar
            data={[
              {
                feature: "3' UTR",
                value: roundToTwoDecimals((metadata.statistics?.mean?.threeutr_percentage || 0) * 100),
              },
              {
                feature: "5' UTR",
                value: roundToTwoDecimals((metadata.statistics?.mean?.fiveutr_percentage || 0) * 100),
              },
              {
                feature: 'Exon',
                value: roundToTwoDecimals((metadata.statistics?.mean?.exon_percentage || 0) * 100),
              },
              {
                feature: 'Intron',
                value: roundToTwoDecimals((metadata.statistics?.mean?.intron_percentage || 0) * 100),
              },
              {
                feature: 'Intergenic',
                value: roundToTwoDecimals((metadata.statistics?.mean?.intergenic_percentage || 0) * 100),
              },
            ]}
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
