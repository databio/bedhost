import { gql } from "@apollo/client";

export const GET_BEDSET_COUNT = gql`
  query bedsets {
    bedsets {
      totalCount
    }
  }
`;

export const GET_BEDSET_NAME = gql`
  query bedsets($md5sum: String!) {
    bedsets(filters: { md5sum: $md5sum }) {
      edges {
        node {
          name
        }
      }
    }
  }
`;

export const GET_BEDSET_GENOME = gql`
  query bedsets($md5sum: String!) {
    bedsets(filters: { md5sum: $md5sum }) {
      edges {
        node {
          genome
        }
      }
    }
  }
`;

export const GET_SAMPLE_BEDSET = gql`
  query bedsets($first: Int!) {
    bedsets(first: $first) {
      edges {
        node {
          md5sum
        }
      }
    }
  }
`;

export const GET_BEDSET_STATS = gql`
  query bedsets($md5sum: String!) {
    bedsets(filters: { md5sum: $md5sum }) {
      edges {
        node {
          bedsetMeans
          bedsetStandardDeviation
        }
      }
    }
  }
`;

export const GET_BEDSET_DOWNLOADS = gql`
  query bedsets($md5sum: String!) {
    bedsets(filters: { md5sum: $md5sum }) {
      edges {
        node {
          bedsetPep
          bedsetTarArchivePath
          bedsetIgdDatabasePath
          bedsetBedfilesGdStats
          bedsetGdStats
        }
      }
    }
  }
`;

export const GET_BEDSET_FIGS = gql`
  query bedsets($md5sum: String!) {
    bedsets(filters: { md5sum: $md5sum }) {
      edges {
        node {
          regionCommonality
        }
      }
    }
  }
`;

export const GET_BEDSET_BEDFILES = gql`
  query bedsets($md5sum: String!) {
    bedsets(filters: { md5sum: $md5sum }) {
      edges {
        node {
          bedfiles {
            edges {
              node {
                name
                md5sum
                regionsNo
                gcContent
                meanRegionWidth
                meanAbsoluteTssDist
                exonFrequency
                exonPercentage
                intronFrequency
                intronPercentage
                promoterproxFrequency
                promoterproxPercentage
                promotercoreFrequency
                promotercorePercentage
                intergenicFrequency
                intergenicPercentage
                threeutrFrequency
                threeutrPercentage
                fiveutrFrequency
                fiveutrPercentage
              }
            }
            totalCount
          }
        }
      }
    }
  }
`;

export const GET_BEDSET_BEDFILE_COUNT = gql`
  query bedsets($md5sum: String!) {
    bedsets(filters: { md5sum: $md5sum }) {
      edges {
        node {
          bedfiles {
            totalCount
          }
        }
      }
    }
  }
`;

export const QUERY_BEDSET = gql`
  query bedsets($filters: BedsetsFilter!, $first: Int!) {
    bedsets(filters: $filters, first: $first) {
      edges {
        node {
          name
          md5sum
          genome
          bedsetMeans
        }
      }
    }
  }
`;