import { gql } from "@apollo/client";

export const GET_BED_COUNT = gql`
  query bedfiles {
    bedfiles {
      totalCount
    }
  }
`;

export const GET_SAMPLE_BED = gql`
  query bedfiles($first: Int!) {
    bedfiles(first: $first) {
      edges {
        node {
          md5sum
        }
      }
    }
  }
`;

export const GET_BED_NAME = gql`
  query bedfiles($md5sum: String!) {
    bedfiles(filters: { md5sum: $md5sum }) {
      edges {
        node {
          name
        }
      }
    }
  }
`;

export const GET_BED_GENOME = gql`
  query bedfiles($md5sum: String!) {
    bedfiles(filters: { md5sum: $md5sum }) {
      edges {
        node {
          genome
        }
      }
    }
  }
`;

export const GET_BED_META = gql`
  query bedfiles($md5sum: String!) {
    bedfiles(filters: { md5sum: $md5sum }) {
      edges {
        node {
          other
        }
      }
    }
  }
`;

export const GET_BED_STATS = gql`
  query bedfiles($md5sum: String!) {
    bedfiles(filters: { md5sum: $md5sum }) {
      edges {
        node {
          gcContent
          regionsNo
          meanAbsoluteTssDist
          meanRegionWidth
          exonPercentage
          intronPercentage
          promoterproxPercentage
          intergenicPercentage
          promotercorePercentage
          fiveutrPercentage
          threeutrPercentage
        }
      }
    }
  }
`;

export const GET_BED_DOWNLOADS = gql`
  query bedfiles($md5sum: String!) {
    bedfiles(filters: { md5sum: $md5sum }) {
      edges {
        node {
          bedfile
          bigbedfile
        }
      }
    }
  }
`;

export const GET_BED_FIGS = gql`
  query bedfiles($md5sum: String!) {
    bedfiles(filters: { md5sum: $md5sum }) {
      edges {
        node {
          tssdist
          chrombins
          gccontent
          paritions
          expectedPartitions
          cumulativePartitions
          widthsHistogram
          neighborDistances
          openChromatin
        }
      }
    }
  }
`;

export const QUERY_BED = gql`
  query bedfiles($filters: BedfilesFilter!, $first: Int!) {
    bedfiles(filters: $filters, first: $first) {
      edges {
        node {
          name
          md5sum
          other
        }
      }
    }
  }
`;

export const GET_BEDSET_BEDFILES = gql`
  query bedsets($md5sum: String!, $first: Int!) {
    bedsets(filters: { md5sum: $md5sum }) {
      edges {
        node {
          bedfiles(first: $first) {
            edges {
              node {
                name
                md5sum
                other
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_BED_DIST = gql`
  query distances($filters: DistancesFilter!) {
    distances (filters:$filters){
      edges{
        node{
          bedId
          score
          bedfile{
            name
            md5sum
            genome
            other
          }
        }
      }
    }
  }
`;
