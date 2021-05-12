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
